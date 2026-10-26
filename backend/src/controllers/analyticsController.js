import mongoose from 'mongoose';
import { Click } from '../models/Click.js';
import { Url } from '../models/Url.js';
import { generateAnalyticsInsights } from '../services/aiService.js';
import { getClickCounter } from '../services/redisService.js';
import { addRealtimeClient } from '../services/realtimeService.js';
import { config } from '../config/env.js';

export async function getUrlAnalytics(req, res, next) {
  try {
    const { shortCode } = req.params;
    const { timeframe = '30d', includeBots = 'false' } = req.query;

    const urlDoc = await Url.findOne({ shortCode });
    if (!urlDoc) {
      return res.status(404).json({
        success: false,
        error: 'URL not found',
      });
    }

    if (urlDoc.userId && (!req.user || req.user._id.toString() !== urlDoc.userId.toString())) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view analytics for this link',
      });
    }

    let startDate = new Date();
    let dateFormat = '%Y-%m-%d';

    if (timeframe === '24h') {
      startDate.setHours(startDate.getHours() - 24);
      dateFormat = '%Y-%m-%d %H:00';
    } else if (timeframe === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate = new Date(0);
    }

    const matchStage = {
      shortCode,
      timestamp: { $gte: startDate },
    };

    if (includeBots !== 'true') {
      matchStage.isBot = { $ne: true };
    }

    const [
      clicksOverTime,
      countries,
      cities,
      devices,
      browsers,
      referrers,
      uniqueVisitorsResult,
      botCountResult,
    ] = await Promise.all([
      Click.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$timestamp' } },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', clicks: 1, _id: 0 } },
      ]),

      Click.aggregate([
        { $match: matchStage },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { country: '$_id', count: 1, _id: 0 } },
      ]),

      Click.aggregate([
        { $match: matchStage },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { city: '$_id', count: 1, _id: 0 } },
      ]),

      Click.aggregate([
        { $match: matchStage },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { device: '$_id', count: 1, _id: 0 } },
      ]),

      Click.aggregate([
        { $match: matchStage },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { browser: '$_id', count: 1, _id: 0 } },
      ]),

      Click.aggregate([
        { $match: matchStage },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { referrer: '$_id', count: 1, _id: 0 } },
      ]),

      Click.aggregate([
        { $match: matchStage },
        { $group: { _id: '$ipHash' } },
        { $count: 'uniqueCount' },
      ]),

      Click.countDocuments({ shortCode, timestamp: { $gte: startDate }, isBot: true }),
    ]);

    const totalClicks = urlDoc.clicksCount || (await getClickCounter(shortCode));
    const uniqueVisitors = uniqueVisitorsResult[0]?.uniqueCount || 0;
    const repeatVisitors = Math.max(0, totalClicks - uniqueVisitors);

    const aiInsights = await generateAnalyticsInsights({
      totalClicks,
      uniqueVisitors,
      countries,
      devices,
      browsers,
      referrers,
    });

    res.json({
      success: true,
      data: {
        shortCode,
        originalUrl: urlDoc.originalUrl,
        shortUrl: `${config.baseUrl}/${urlDoc.shortCode}`,
        title: urlDoc.title,
        category: urlDoc.category,
        tags: urlDoc.tags,
        folder: urlDoc.folder,
        createdAt: urlDoc.createdAt,
        expiresAt: urlDoc.expiresAt,
        summary: {
          totalClicks,
          uniqueVisitors,
          repeatVisitors,
          botClicks: botCountResult,
          timeframe,
        },
        clicksOverTime,
        countries,
        cities,
        devices,
        browsers,
        referrers,
        aiInsights,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req, res, next) {
  try {
    const { shortCode } = req.params;
    const urlDoc = await Url.findOne({ shortCode });
    if (!urlDoc) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    if (urlDoc.userId && (!req.user || req.user._id.toString() !== urlDoc.userId.toString())) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const clicks = await Click.find({ shortCode }).sort({ timestamp: -1 }).limit(5000);

    const csvRows = [
      'Timestamp,Country,City,Device,Browser,OS,Referrer,IsBot,IPHash',
    ];

    for (const c of clicks) {
      const row = [
        c.timestamp ? c.timestamp.toISOString() : '',
        `"${(c.country || '').replace(/"/g, '""')}"`,
        `"${(c.city || '').replace(/"/g, '""')}"`,
        c.device || '',
        `"${(c.browser || '').replace(/"/g, '""')}"`,
        `"${(c.os || '').replace(/"/g, '""')}"`,
        `"${(c.referrer || '').replace(/"/g, '""')}"`,
        c.isBot ? 'true' : 'false',
        c.ipHash || '',
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${shortCode}.csv"`);
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
}

export function streamRealtimeClicks(req, res) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid token or session cookie to subscribe to the live telemetry stream.',
    });
  }
  addRealtimeClient(res, req.user._id);
}

export async function askAiNaturalLanguage(req, res, next) {
  try {
    const { query, shortCode } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'query is required' });
    }

    let filter = {};
    if (shortCode) filter.shortCode = shortCode;
    else if (req.user) {
      const userUrls = await Url.find({ userId: req.user._id }).select('shortCode');
      filter.shortCode = { $in: userUrls.map((u) => u.shortCode) };
    }

    const [totalClicks, topCountries, topDevices, topCities] = await Promise.all([
      Click.countDocuments(filter),
      Click.aggregate([
        { $match: filter },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Click.aggregate([
        { $match: filter },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Click.aggregate([
        { $match: filter },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const context = `
URL Shortener Traffic Stats:
Total Clicks: ${totalClicks}
Top Countries: ${JSON.stringify(topCountries)}
Top Devices: ${JSON.stringify(topDevices)}
Top Cities: ${JSON.stringify(topCities)}
`;

    let answer = '';
    if (config.geminiApiKey) {
      const prompt = `You are an AI analytics assistant for a URL shortener platform.
Context:
${context}

User Question: "${query}"

Provide a concise, direct, helpful 2 to 3 sentence answer based strictly on the provided stats.`;

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${config.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
            signal: AbortSignal.timeout(8000),
          }
        );
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        }
      } catch {}
    }

    if (!answer) {
      answer = `Based on your telemetry, you have recorded ${totalClicks} total clicks. The top device category is ${topDevices[0]?._id || 'desktop'} with top geographic traffic from ${topCountries[0]?._id || 'Unknown'}.`;
    }

    res.json({
      success: true,
      data: {
        query,
        answer,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardOverview(req, res, next) {
  try {
    const userId = req.user._id;

    const [totalLinks, clicksAgg, recentLinks] = await Promise.all([
      Url.countDocuments({ userId }),
      Url.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalClicks: { $sum: '$clicksCount' } } },
      ]),
      Url.find({ userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    const totalClicks = clicksAgg[0]?.totalClicks || 0;

    res.json({
      success: true,
      data: {
        totalLinks,
        totalClicks,
        recentLinks: recentLinks.map((u) => ({
          ...u.toJSON(),
          shortUrl: `${config.baseUrl}/${u.shortCode}`,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}
