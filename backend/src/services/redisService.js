import { getRedisClient, isRedisAvailable } from '../config/redis.js';
import { Counter } from '../models/Counter.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

const INITIAL_COUNTER_OFFSET = 10000000;

export async function getNextShortId() {
  if (isRedisAvailable()) {
    try {
      const redis = getRedisClient();

      const exists = await redis.exists('url_counter');
      if (!exists) {
        await redis.set('url_counter', INITIAL_COUNTER_OFFSET);
      }
      const nextId = await redis.incr('url_counter');
      return nextId;
    } catch (err) {
      logger.warn(`Redis getNextShortId failed, falling back to Mongo: ${err.message}`);
    }
  }

  const counter = await Counter.findByIdAndUpdate(
    'url_counter',
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return counter.seq;
}

export async function cacheUrl(shortCode, data, ttlSeconds = config.cacheTtlSeconds) {
  if (!isRedisAvailable() || !shortCode) return;
  try {
    const redis = getRedisClient();
    const key = `url:${shortCode}`;
    const value = JSON.stringify(data);
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, value, 'EX', Math.floor(ttlSeconds));
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    logger.warn(`Redis cacheUrl failed for ${shortCode}: ${err.message}`);
  }
}

export async function getUrlFromCache(shortCode) {
  if (!isRedisAvailable() || !shortCode) return null;
  try {
    const redis = getRedisClient();
    const data = await redis.get(`url:${shortCode}`);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    logger.warn(`Redis getUrlFromCache failed for ${shortCode}: ${err.message}`);
    return null;
  }
}

export async function cacheNotFound(shortCode, ttlSeconds = config.negativeCacheTtlSeconds) {
  if (!isRedisAvailable() || !shortCode) return;
  try {
    const redis = getRedisClient();
    await redis.set(`url:${shortCode}`, JSON.stringify({ notFound: true }), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn(`Redis cacheNotFound failed for ${shortCode}: ${err.message}`);
  }
}

export async function invalidateUrl(shortCode) {
  if (!isRedisAvailable() || !shortCode) return;
  try {
    const redis = getRedisClient();
    await redis.del(`url:${shortCode}`);
  } catch (err) {
    logger.warn(`Redis invalidateUrl failed for ${shortCode}: ${err.message}`);
  }
}

export async function incrementClickCounter(shortCode) {
  if (!isRedisAvailable() || !shortCode) return;
  try {
    const redis = getRedisClient();
    await redis.hincrby('url_clicks', shortCode, 1);
  } catch (err) {
    logger.warn(`Redis incrementClickCounter failed for ${shortCode}: ${err.message}`);
  }
}

export async function getClickCounter(shortCode) {
  if (!isRedisAvailable() || !shortCode) return 0;
  try {
    const redis = getRedisClient();
    const count = await redis.hget('url_clicks', shortCode);
    return count ? parseInt(count, 10) : 0;
  } catch (err) {
    return 0;
  }
}

export async function checkRateLimit(key, maxRequests, windowSeconds) {
  if (!isRedisAvailable()) {

    return { allowed: true, remaining: maxRequests, retryAfter: 0, total: 1 };
  }

  try {
    const redis = getRedisClient();
    const rateLimitKey = `ratelimit:${key}`;
    const current = await redis.incr(rateLimitKey);

    if (current === 1) {
      await redis.expire(rateLimitKey, windowSeconds);
    }

    const ttl = await redis.ttl(rateLimitKey);
    const retryAfter = ttl > 0 ? ttl : windowSeconds;

    if (current > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
        total: current,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - current),
      retryAfter: 0,
      total: current,
    };
  } catch (err) {
    logger.warn(`Redis checkRateLimit failed: ${err.message}`);
    return { allowed: true, remaining: maxRequests, retryAfter: 0, total: 1 };
  }
}

export async function checkDailyQuota(identifier, maxQuota) {
  const today = new Date().toISOString().slice(0, 10);
  const quotaKey = `quota:${identifier}:${today}`;

  if (!isRedisAvailable()) {
    return { allowed: true, current: 0, max: maxQuota, remaining: maxQuota, resetInSeconds: 0 };
  }

  try {
    const redis = getRedisClient();
    const current = await redis.incr(quotaKey);

    if (current === 1) {

      await redis.expire(quotaKey, 86400);
    }

    const ttl = await redis.ttl(quotaKey);
    const resetInSeconds = ttl > 0 ? ttl : 86400;

    const allowed = current <= maxQuota;
    const remaining = Math.max(0, maxQuota - current);

    return {
      allowed,
      current,
      max: maxQuota,
      remaining,
      resetInSeconds,
    };
  } catch (err) {
    logger.warn(`Redis checkDailyQuota failed: ${err.message}`);
    return { allowed: true, current: 0, max: maxQuota, remaining: maxQuota, resetInSeconds: 0 };
  }
}
