import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import { Url } from '../models/Url.js';
import { encodeBase62, isValidSlug } from '../utils/base62.js';
import { validateUrlSecurity, RESERVED_SLUGS, escapeRegex } from '../utils/ssrfValidator.js';
import {
  getNextShortId,
  cacheUrl,
  getUrlFromCache,
  cacheNotFound,
  invalidateUrl,
} from './redisService.js';
import { scanUrlSafety, categorizeUrl, extractPageMetadata } from './aiService.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export async function createShortUrl({
  originalUrl,
  customAlias,
  userId = null,
  expiresAt = null,
  activateAt = null,
  clickLimit = null,
  isOneTime = false,
  password = null,
  showPreview = false,
  category = null,
  tags = [],
  folder = 'Default',
  deviceTargeting = {},
  geoTargeting = [],
  utm = {},
  abTest = {},
  title = null,
}) {
  const securityCheck = await validateUrlSecurity(originalUrl);
  if (!securityCheck.isValid) {
    const error = new Error(securityCheck.reason || 'Invalid or unsafe destination URL');
    error.statusCode = 400;
    throw error;
  }

  const aiSafety = await scanUrlSafety(originalUrl);
  if (!aiSafety.isSafe) {
    const error = new Error(`URL rejected by AI safety scanner: ${aiSafety.reasons.join(', ')}`);
    error.statusCode = 400;
    error.details = aiSafety;
    throw error;
  }

  let shortCode;
  if (customAlias && customAlias.trim()) {
    const cleanAlias = customAlias.trim().toLowerCase();

    if (!isValidSlug(cleanAlias)) {
      const error = new Error('Custom alias must be 2-50 characters with letters, numbers, hyphens or underscores');
      error.statusCode = 400;
      throw error;
    }

    if (RESERVED_SLUGS.has(cleanAlias)) {
      const error = new Error(`The alias "${cleanAlias}" is a reserved system keyword`);
      error.statusCode = 400;
      throw error;
    }

    const existing = await Url.findOne({ shortCode: cleanAlias });
    if (existing) {
      const error = new Error(`The custom alias "${cleanAlias}" is already taken`);
      error.statusCode = 409;
      throw error;
    }

    shortCode = cleanAlias;
  } else {
    const nextId = await getNextShortId();
    shortCode = encodeBase62(nextId);
  }

  let pageTitle = title;
  let detectedCategory = category;
  let finalTags = tags;

  try {
    const meta = await extractPageMetadata(originalUrl);
    if (!pageTitle && meta.title) {
      pageTitle = meta.title;
    }
    if (!detectedCategory || detectedCategory === 'General') {
      const catResult = await categorizeUrl(originalUrl, meta.title);
      detectedCategory = catResult.category;
      if (!finalTags || finalTags.length === 0) {
        finalTags = catResult.tags;
      }
    }
  } catch (metaErr) {
    logger.debug(`Metadata extraction skipped: ${metaErr.message}`);
  }

  let passwordHash = null;
  if (password && password.trim()) {
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(password.trim(), salt);
  }

  const shortUrl = `${config.baseUrl}/${shortCode}`;
  let qrCodeData = '';
  try {
    qrCodeData = await QRCode.toDataURL(shortUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 250,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });
  } catch (qrErr) {
    logger.warn(`QR Code generation failed: ${qrErr.message}`);
  }

  let urlDoc = null;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      urlDoc = await Url.create({
        shortCode,
        originalUrl,
        userId,
        customAlias: customAlias ? shortCode : null,
        title: pageTitle || originalUrl,
        category: detectedCategory || 'General',
        tags: finalTags || [],
        folder: folder || 'Default',
        isOneTime: !!isOneTime,
        clickLimit: clickLimit ? parseInt(clickLimit, 10) : null,
        passwordHash,
        showPreview: !!showPreview,
        activateAt: activateAt ? new Date(activateAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        deviceTargeting: {
          iosUrl: deviceTargeting.iosUrl || null,
          androidUrl: deviceTargeting.androidUrl || null,
          desktopUrl: deviceTargeting.desktopUrl || null,
        },
        geoTargeting: Array.isArray(geoTargeting) ? geoTargeting : [],
        utm: {
          source: utm.source || null,
          medium: utm.medium || null,
          campaign: utm.campaign || null,
          term: utm.term || null,
          content: utm.content || null,
        },
        abTest: {
          isEnabled: !!abTest.isEnabled,
          variants: Array.isArray(abTest.variants) ? abTest.variants : [],
        },
        aiSafety,
        qrCodeData,
      });
      break;
    } catch (createErr) {
      if (createErr.code === 11000 && !customAlias) {
        attempts++;
        const nextId = await getNextShortId();
        shortCode = encodeBase62(nextId);
        continue;
      }
      throw createErr;
    }
  }

  let ttlSeconds = config.cacheTtlSeconds;
  if (expiresAt) {
    const diffSeconds = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    if (diffSeconds > 0) {
      ttlSeconds = Math.min(ttlSeconds, diffSeconds);
    }
  }

  if (!isOneTime && !passwordHash && (!abTest || !abTest.isEnabled)) {
    await cacheUrl(
      shortCode,
      {
        _id: urlDoc._id.toString(),
        userId: urlDoc.userId ? urlDoc.userId.toString() : null,
        shortCode: urlDoc.shortCode,
        originalUrl: urlDoc.originalUrl,
        isActive: urlDoc.isActive,
        isFlagged: urlDoc.isFlagged,
        activateAt: urlDoc.activateAt ? urlDoc.activateAt.toISOString() : null,
        expiresAt: urlDoc.expiresAt ? urlDoc.expiresAt.toISOString() : null,
        clickLimit: urlDoc.clickLimit,
        clicksCount: urlDoc.clicksCount,
        showPreview: urlDoc.showPreview,
        deviceTargeting: urlDoc.deviceTargeting,
        geoTargeting: urlDoc.geoTargeting,
      },
      ttlSeconds
    );
  }

  return urlDoc;
}

export async function bulkCreateShortUrls(items, userId) {
  const results = [];
  for (const item of items) {
    try {
      const created = await createShortUrl({
        originalUrl: item.originalUrl || item.url,
        customAlias: item.customAlias || item.alias,
        title: item.title,
        category: item.category,
        tags: Array.isArray(item.tags) ? item.tags : (item.tags ? String(item.tags).split(',') : []),
        folder: item.folder,
        userId,
      });
      results.push({
        success: true,
        originalUrl: item.originalUrl || item.url,
        shortUrl: `${config.baseUrl}/${created.shortCode}`,
        shortCode: created.shortCode,
      });
    } catch (err) {
      results.push({
        success: false,
        originalUrl: item.originalUrl || item.url,
        error: err.message,
      });
    }
  }
  return results;
}

export async function resolveShortUrl(shortCode, clientDetails = {}) {
  const { device = 'desktop', country = 'Unknown' } = clientDetails;

  let urlDoc = await getUrlFromCache(shortCode);
  let isFromCache = !!urlDoc;

  if (!urlDoc) {
    const dbDoc = await Url.findOne({ shortCode });
    if (!dbDoc) {
      await cacheNotFound(shortCode);
      return { status: 'not_found' };
    }
    urlDoc = dbDoc.toObject();
    urlDoc._id = dbDoc._id.toString();
    urlDoc.hasPassword = !!dbDoc.passwordHash;
    urlDoc.passwordHash = dbDoc.passwordHash;
  }

  if (urlDoc.notFound) {
    return { status: 'not_found' };
  }

  if (!urlDoc.isActive || urlDoc.isFlagged) {
    return { status: 'disabled' };
  }

  const now = Date.now();
  if (urlDoc.activateAt && new Date(urlDoc.activateAt).getTime() > now) {
    return {
      status: 'scheduled',
      activateAt: urlDoc.activateAt,
      shortCode: urlDoc.shortCode,
    };
  }

  if (urlDoc.expiresAt && new Date(urlDoc.expiresAt).getTime() <= now) {
    return { status: 'expired' };
  }

  if (urlDoc.clickLimit && urlDoc.clicksCount >= urlDoc.clickLimit) {
    await Url.findByIdAndUpdate(urlDoc._id, { isActive: false });
    await invalidateUrl(shortCode);
    return { status: 'limit_reached' };
  }

  if (urlDoc.passwordHash || urlDoc.hasPassword) {
    return {
      status: 'password_required',
      shortCode: urlDoc.shortCode,
      urlId: urlDoc._id,
    };
  }

  if (urlDoc.showPreview) {
    return {
      status: 'preview',
      shortCode: urlDoc.shortCode,
      urlId: urlDoc._id,
      originalUrl: urlDoc.originalUrl,
      title: urlDoc.title,
    };
  }

  let targetUrl = urlDoc.originalUrl;

  if (urlDoc.geoTargeting && Array.isArray(urlDoc.geoTargeting)) {
    const geoMatch = urlDoc.geoTargeting.find(
      (g) => g.country && g.country.toUpperCase() === country.toUpperCase()
    );
    if (geoMatch && geoMatch.url) {
      targetUrl = geoMatch.url;
    }
  }

  if (urlDoc.deviceTargeting) {
    if (device === 'mobile') {
      if (urlDoc.deviceTargeting.iosUrl && /iPhone|iPad|iPod/i.test(clientDetails.userAgent || '')) {
        targetUrl = urlDoc.deviceTargeting.iosUrl;
      } else if (urlDoc.deviceTargeting.androidUrl && /Android/i.test(clientDetails.userAgent || '')) {
        targetUrl = urlDoc.deviceTargeting.androidUrl;
      }
    } else if (device === 'desktop' && urlDoc.deviceTargeting.desktopUrl) {
      targetUrl = urlDoc.deviceTargeting.desktopUrl;
    }
  }

  if (urlDoc.abTest && urlDoc.abTest.isEnabled && urlDoc.abTest.variants?.length > 0) {
    const totalWeight = urlDoc.abTest.variants.reduce((acc, v) => acc + (v.weight || 50), 0);
    let rand = Math.random() * totalWeight;
    for (const v of urlDoc.abTest.variants) {
      rand -= (v.weight || 50);
      if (rand <= 0) {
        targetUrl = v.url;
        Url.updateOne(
          { _id: urlDoc._id, 'abTest.variants.url': v.url },
          { $inc: { 'abTest.variants.$.clicks': 1 } }
        ).catch(() => {});
        break;
      }
    }
  }

  if (urlDoc.isOneTime) {
    await Url.findByIdAndUpdate(urlDoc._id, { isActive: false });
    await invalidateUrl(shortCode);
  }

  if (urlDoc.clickLimit && urlDoc.clicksCount + 1 >= urlDoc.clickLimit) {
    await Url.findByIdAndUpdate(urlDoc._id, { isActive: false });
    await invalidateUrl(shortCode);
  }

  if (urlDoc.utm && (urlDoc.utm.source || urlDoc.utm.medium || urlDoc.utm.campaign || urlDoc.utm.term || urlDoc.utm.content)) {
    try {
      const u = new URL(targetUrl);
      if (urlDoc.utm.source && !u.searchParams.has('utm_source')) u.searchParams.set('utm_source', urlDoc.utm.source);
      if (urlDoc.utm.medium && !u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', urlDoc.utm.medium);
      if (urlDoc.utm.campaign && !u.searchParams.has('utm_campaign')) u.searchParams.set('utm_campaign', urlDoc.utm.campaign);
      if (urlDoc.utm.term && !u.searchParams.has('utm_term')) u.searchParams.set('utm_term', urlDoc.utm.term);
      if (urlDoc.utm.content && !u.searchParams.has('utm_content')) u.searchParams.set('utm_content', urlDoc.utm.content);
      targetUrl = u.toString();
    } catch {}
  }

  return {
    status: 'active',
    urlId: urlDoc._id,
    userId: urlDoc.userId,
    shortCode: urlDoc.shortCode,
    originalUrl: targetUrl,
    source: isFromCache ? 'cache' : 'db',
  };
}

export async function getUserUrls(userId, { page = 1, limit = 20, search = '', category = '', status = '', folder = '' }) {
  const query = { userId };

  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    query.$or = [
      { shortCode: { $regex: escaped, $options: 'i' } },
      { originalUrl: { $regex: escaped, $options: 'i' } },
      { title: { $regex: escaped, $options: 'i' } },
      { tags: { $in: [new RegExp(escaped, 'i')] } },
    ];
  }

  if (category && category !== 'All') {
    query.category = category;
  }

  if (folder && folder !== 'All') {
    query.folder = folder;
  }

  if (status === 'active') {
    query.isActive = true;
    query.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];
  } else if (status === 'disabled') {
    query.isActive = false;
  } else if (status === 'expired') {
    query.expiresAt = { $lte: new Date() };
  }

  const skip = (page - 1) * limit;
  const [urls, total, folders] = await Promise.all([
    Url.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Url.countDocuments(query),
    Url.distinct('folder', { userId }),
  ]);

  return {
    urls,
    folders: folders.filter(Boolean),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function updateUrl(urlId, userId, updateData) {
  const query = userId ? { _id: urlId, userId } : { _id: urlId };
  const url = await Url.findOne(query);
  if (!url) {
    const error = new Error('URL not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  if (updateData.originalUrl && updateData.originalUrl !== url.originalUrl) {
    const security = await validateUrlSecurity(updateData.originalUrl);
    if (!security.isValid) {
      const error = new Error(security.reason || 'Invalid destination URL');
      error.statusCode = 400;
      throw error;
    }
    url.originalUrl = updateData.originalUrl;
  }

  if (typeof updateData.isActive === 'boolean') url.isActive = updateData.isActive;
  if (updateData.title !== undefined) url.title = updateData.title;
  if (updateData.category !== undefined) url.category = updateData.category;
  if (updateData.folder !== undefined) url.folder = updateData.folder;
  if (updateData.tags !== undefined) url.tags = updateData.tags;
  if (updateData.showPreview !== undefined) url.showPreview = !!updateData.showPreview;
  if (updateData.isOneTime !== undefined) url.isOneTime = !!updateData.isOneTime;
  if (updateData.clickLimit !== undefined) {
    url.clickLimit = updateData.clickLimit ? parseInt(updateData.clickLimit, 10) : null;
  }
  if (updateData.deviceTargeting) url.deviceTargeting = updateData.deviceTargeting;
  if (updateData.geoTargeting) url.geoTargeting = updateData.geoTargeting;
  if (updateData.utm) url.utm = updateData.utm;
  if (updateData.abTest) url.abTest = updateData.abTest;

  if (updateData.password !== undefined) {
    if (updateData.password && updateData.password.trim()) {
      const salt = await bcrypt.genSalt(10);
      url.passwordHash = await bcrypt.hash(updateData.password.trim(), salt);
    } else {
      url.passwordHash = null;
    }
  }

  if (updateData.activateAt !== undefined) {
    url.activateAt = updateData.activateAt ? new Date(updateData.activateAt) : null;
  }
  if (updateData.expiresAt !== undefined) {
    url.expiresAt = updateData.expiresAt ? new Date(updateData.expiresAt) : null;
  }

  await url.save();
  await invalidateUrl(url.shortCode);

  return url;
}

export async function deleteUrl(urlId, userId) {
  const query = userId ? { _id: urlId, userId } : { _id: urlId };
  const url = await Url.findOneAndDelete(query);
  if (!url) {
    const error = new Error('URL not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  await invalidateUrl(url.shortCode);
  return { success: true, message: 'URL deleted successfully' };
}
