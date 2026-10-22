import { UAParser } from 'ua-parser-js';
import bcrypt from 'bcryptjs';
import { resolveShortUrl } from '../services/urlService.js';
import { enqueueClick } from '../services/queueService.js';
import { incrementClickCounter } from '../services/redisService.js';
import { lookupGeo, hashIp } from '../services/geoIpService.js';
import { broadcastRealtimeClick } from '../services/realtimeService.js';
import { triggerWebhooks } from '../services/webhookService.js';
import { Url } from '../models/Url.js';
import {
  redirectsTotal,
  cacheHitsCounter,
  cacheMissesCounter,
} from '../middleware/metrics.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const BOT_REGEX = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|twitterbot|slackbot|telegrambot|curl|wget|lighthouse|googlebot|bingbot|yahoo|duckduckbot|yandex|baiduspider/i;

export async function handleRedirect(req, res, next) {
  const { shortCode } = req.params;

  try {
    const ip = req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : req.ip || req.socket.remoteAddress;

    const userAgent = req.headers['user-agent'] || '';
    const isBot = BOT_REGEX.test(userAgent);

    const parser = new UAParser(userAgent);
    const uaResult = parser.getResult();
    const deviceType = uaResult.device.type || (userAgent.includes('Mobile') ? 'mobile' : 'desktop');
    const browser = uaResult.browser.name || 'Unknown';
    const os = uaResult.os.name || 'Unknown';

    const geo = lookupGeo(ip, req.headers);

    const clientDetails = {
      device: deviceType,
      browser,
      os,
      country: geo.country,
      city: geo.city,
      userAgent,
      isBot,
    };

    if (req.query.preview === '1') {
      const urlDoc = await Url.findOne({ shortCode });
      if (urlDoc) {
        return res.redirect(`${config.clientUrl}/preview?code=${encodeURIComponent(shortCode)}`);
      }
    }

    const result = await resolveShortUrl(shortCode, clientDetails);

    if (result.status === 'not_found') {
      redirectsTotal.inc({ status: 'not_found', source: 'none' });
      if (req.accepts('html')) {
        return res.status(404).redirect(`${config.clientUrl}/not-found?code=${encodeURIComponent(shortCode)}`);
      }
      return res.status(404).json({ success: false, error: 'Short link not found or does not exist.' });
    }

    if (result.status === 'expired') {
      redirectsTotal.inc({ status: 'expired', source: result.source || 'db' });
      triggerWebhooks('link.expired', { shortCode }, result.userId).catch(() => {});
      if (req.accepts('html')) {
        return res.status(410).redirect(`${config.clientUrl}/expired?code=${encodeURIComponent(shortCode)}`);
      }
      return res.status(410).json({ success: false, error: 'This short link has expired.' });
    }

    if (result.status === 'disabled') {
      redirectsTotal.inc({ status: 'disabled', source: result.source || 'db' });
      if (req.accepts('html')) {
        return res.status(403).redirect(`${config.clientUrl}/disabled?code=${encodeURIComponent(shortCode)}`);
      }
      return res.status(403).json({ success: false, error: 'This short link is currently disabled.' });
    }

    if (result.status === 'scheduled') {
      if (req.accepts('html')) {
        return res.redirect(`${config.clientUrl}/scheduled?code=${encodeURIComponent(shortCode)}&time=${encodeURIComponent(result.activateAt)}`);
      }
      return res.status(403).json({ success: false, error: 'This link has not yet activated.' });
    }

    if (result.status === 'limit_reached') {
      triggerWebhooks('link.limit_reached', { shortCode }, result.userId).catch(() => {});
      if (req.accepts('html')) {
        return res.redirect(`${config.clientUrl}/limit-reached?code=${encodeURIComponent(shortCode)}`);
      }
      return res.status(410).json({ success: false, error: 'This short link has reached its click limit.' });
    }

    if (result.status === 'password_required') {
      if (req.accepts('html')) {
        return res.redirect(`${config.clientUrl}/protected?code=${encodeURIComponent(shortCode)}`);
      }
      return res.status(401).json({ success: false, error: 'Password required to access link.', isProtected: true });
    }

    if (result.status === 'preview') {
      return res.redirect(`${config.clientUrl}/preview?code=${encodeURIComponent(shortCode)}`);
    }

    if (result.source === 'cache') {
      cacheHitsCounter.inc();
    } else {
      cacheMissesCounter.inc();
    }
    redirectsTotal.inc({ status: 'active', source: result.source });

    const referrerHeader = req.headers['referer'] || req.headers['referrer'] || '';
    let referrer = 'Direct';
    if (referrerHeader) {
      try {
        const refUrl = new URL(referrerHeader);
        referrer = refUrl.hostname.replace(/^www\./, '');
      } catch {
        referrer = referrerHeader.slice(0, 50);
      }
    }

    const clickPayload = {
      urlId: result.urlId,
      userId: result.userId,
      shortCode,
      timestamp: new Date(),
      ipHash: hashIp(ip),
      country: geo.country,
      city: geo.city,
      device: deviceType,
      browser,
      os,
      referrer,
      userAgent: userAgent.slice(0, 255),
      isBot,
      variantUrl: result.originalUrl,
    };

    if (!isBot) {
      enqueueClick(clickPayload).catch((err) => {
        logger.warn(`Failed to enqueue click for ${shortCode}: ${err.message}`);
      });
      incrementClickCounter(shortCode).catch(() => {});
    }

    broadcastRealtimeClick({
      shortCode,
      country: geo.country,
      city: geo.city,
      device: deviceType,
      browser,
      referrer,
      isBot,
      timestamp: new Date().toISOString(),
      userId: result.userId,
    });

    triggerWebhooks('link.clicked', clickPayload, result.userId).catch(() => {});

    return res.redirect(config.redirectStatusCode, result.originalUrl);
  } catch (err) {
    logger.error(`Redirect error for ${shortCode}: ${err.message}`);
    next(err);
  }
}

export async function verifyPassword(req, res, next) {
  try {
    const { shortCode, password } = req.body;
    if (!shortCode || !password) {
      return res.status(400).json({ success: false, error: 'shortCode and password are required' });
    }

    const urlDoc = await Url.findOne({ shortCode });
    if (!urlDoc || !urlDoc.passwordHash) {
      return res.status(404).json({ success: false, error: 'Protected link not found' });
    }

    const isMatch = await bcrypt.compare(password, urlDoc.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    res.json({
      success: true,
      data: {
        shortCode,
        originalUrl: urlDoc.originalUrl,
        title: urlDoc.title,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLinkPreview(req, res, next) {
  try {
    const { shortCode } = req.params;
    const urlDoc = await Url.findOne({ shortCode });
    if (!urlDoc) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }

    res.json({
      success: true,
      data: {
        shortCode: urlDoc.shortCode,
        originalUrl: urlDoc.originalUrl,
        title: urlDoc.title,
        category: urlDoc.category,
        tags: urlDoc.tags,
        clicksCount: urlDoc.clicksCount,
        aiSafety: urlDoc.aiSafety,
        createdAt: urlDoc.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
