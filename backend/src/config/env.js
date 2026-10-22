import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/urlshortener',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'url-shortener-super-secret-jwt-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10),
  dailyQuotaRegistered: parseInt(process.env.DAILY_QUOTA_REGISTERED || '100', 10),
  dailyQuotaAnonymous: parseInt(process.env.DAILY_QUOTA_ANONYMOUS || '5', 10),

  googleSafeBrowsingKey: process.env.GOOGLE_SAFE_BROWSING_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  aiProvider: process.env.AI_PROVIDER || 'local',

  redirectStatusCode: parseInt(process.env.REDIRECT_STATUS_CODE || '302', 10),
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '86400', 10),
  negativeCacheTtlSeconds: parseInt(process.env.NEGATIVE_CACHE_TTL_SECONDS || '60', 10),
};
