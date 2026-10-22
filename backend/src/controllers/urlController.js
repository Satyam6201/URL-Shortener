import {
  createShortUrl,
  bulkCreateShortUrls,
  getUserUrls,
  updateUrl,
  deleteUrl,
} from '../services/urlService.js';
import { Url } from '../models/Url.js';
import { checkDailyQuota } from '../services/redisService.js';
import { config } from '../config/env.js';

export async function createUrl(req, res, next) {
  try {
    const {
      originalUrl,
      customAlias,
      expiresAt,
      activateAt,
      clickLimit,
      isOneTime,
      password,
      showPreview,
      category,
      tags,
      folder,
      deviceTargeting,
      geoTargeting,
      utm,
      abTest,
      title,
    } = req.body;

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        error: 'originalUrl is required',
      });
    }

    const userId = req.user ? req.user._id : null;

    const urlDoc = await createShortUrl({
      originalUrl,
      customAlias,
      userId,
      expiresAt,
      activateAt,
      clickLimit,
      isOneTime,
      password,
      showPreview,
      category,
      tags,
      folder,
      deviceTargeting,
      geoTargeting,
      utm,
      abTest,
      title,
    });

    res.status(201).json({
      success: true,
      data: {
        ...urlDoc.toJSON(),
        shortUrl: `${config.baseUrl}/${urlDoc.shortCode}`,
      },
      message: 'Short link created successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function bulkCreateUrls(req, res, next) {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ success: false, error: 'urls must be a non-empty array' });
    }

    if (urls.length > 100) {
      return res.status(400).json({ success: false, error: 'Maximum 100 links per bulk request' });
    }

    const userId = req.user ? req.user._id : null;
    const results = await bulkCreateShortUrls(urls, userId);

    res.status(201).json({
      success: true,
      data: results,
      totalCreated: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
    });
  } catch (err) {
    next(err);
  }
}

export async function listUrls(req, res, next) {
  try {
    const { page, limit, search, category, status, folder } = req.query;
    const result = await getUserUrls(req.user._id, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10),
      search,
      category,
      status,
      folder,
    });

    const enrichedUrls = result.urls.map((u) => ({
      ...u.toJSON(),
      shortUrl: `${config.baseUrl}/${u.shortCode}`,
    }));

    res.json({
      success: true,
      data: enrichedUrls,
      folders: result.folders,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUrlById(req, res, next) {
  try {
    const url = await Url.findOne({ _id: req.params.id, userId: req.user._id });
    if (!url) {
      return res.status(404).json({
        success: false,
        error: 'URL not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...url.toJSON(),
        shortUrl: `${config.baseUrl}/${url.shortCode}`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUrlHandler(req, res, next) {
  try {
    const updated = await updateUrl(req.params.id, req.user._id, req.body);
    res.json({
      success: true,
      data: {
        ...updated.toJSON(),
        shortUrl: `${config.baseUrl}/${updated.shortCode}`,
      },
      message: 'URL updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteUrlHandler(req, res, next) {
  try {
    const result = await deleteUrl(req.params.id, req.user._id);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserQuota(req, res, next) {
  try {
    const isAuth = !!req.user;
    const maxQuota = isAuth
      ? (req.user.dailyQuota || config.dailyQuotaRegistered)
      : config.dailyQuotaAnonymous;

    const identifier = isAuth
      ? `user:${req.user._id}`
      : `anon:${req.ip || req.socket.remoteAddress}`;

    const quota = await checkDailyQuota(identifier, maxQuota);

    res.json({
      success: true,
      data: {
        isAuthenticated: isAuth,
        plan: req.user?.plan || 'anonymous',
        dailyLimit: maxQuota,
        usedToday: quota.current,
        remainingToday: quota.remaining,
        resetsInSeconds: quota.resetInSeconds,
      },
    });
  } catch (err) {
    next(err);
  }
}
