import { checkRateLimit, checkDailyQuota } from '../services/redisService.js';
import { config } from '../config/env.js';
import { rateLimitHitsCounter } from './metrics.js';

export function createRateLimiter({ max = 60, windowSeconds = 60, keyPrefix = 'api' } = {}) {
  return async (req, res, next) => {

    const clientIdentifier = req.user ? `user:${req.user._id}` : `ip:${req.ip || req.socket.remoteAddress}`;
    const rateKey = `${keyPrefix}:${clientIdentifier}`;

    const result = await checkRateLimit(rateKey, max, windowSeconds);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      if (rateLimitHitsCounter) {
        rateLimitHitsCounter.inc({ type: keyPrefix });
      }

      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. You have made ${result.total} requests. Please retry in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      });
    }

    next();
  };
}

export async function dailyQuotaLimiter(req, res, next) {
  const isAuth = !!req.user;
  const maxQuota = isAuth
    ? (req.user.dailyQuota || config.dailyQuotaRegistered)
    : config.dailyQuotaAnonymous;

  const identifier = isAuth
    ? `user:${req.user._id}`
    : `anon:${req.ip || req.socket.remoteAddress}`;

  const result = await checkDailyQuota(identifier, maxQuota);

  res.setHeader('X-Daily-Quota-Limit', maxQuota);
  res.setHeader('X-Daily-Quota-Remaining', result.remaining);

  if (!result.allowed) {
    res.setHeader('Retry-After', result.resetInSeconds);
    if (rateLimitHitsCounter) {
      rateLimitHitsCounter.inc({ type: 'daily_quota' });
    }

    return res.status(429).json({
      success: false,
      error: 'Daily Quota Exceeded',
      message: isAuth
        ? `You have reached your daily quota of ${maxQuota} links. Quota resets in ${Math.ceil(result.resetInSeconds / 3600)} hours.`
        : `Anonymous users are limited to ${maxQuota} links per day. Please register or sign in for a full 100+ links/day quota!`,
      current: result.current,
      max: maxQuota,
      retryAfter: result.resetInSeconds,
      isAnonymous: !isAuth,
    });
  }

  req.dailyQuota = result;
  next();
}
