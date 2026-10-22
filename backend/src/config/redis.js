import Redis from 'ioredis';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient = null;
let isConnected = false;

export function getRedisClient() {
  if (redisClient) return redisClient;

  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      logger.warn(`Redis reconnecting, attempt ${times}, delay ${delay}ms...`);
      return delay;
    },
    reconnectOnError(err) {
      const targetErrors = [/READONLY/, /ETIMEDOUT/];
      return targetErrors.some((target) => target.test(err.message));
    },
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('ready', () => {
    isConnected = true;
    logger.info('Redis client ready for commands');
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    logger.warn(`Redis connection error (fallback mode active): ${err.message}`);
  });

  redisClient.on('close', () => {
    isConnected = false;
    logger.warn('Redis connection closed');
  });

  return redisClient;
}

export function isRedisAvailable() {
  return isConnected && redisClient && redisClient.status === 'ready';
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    isConnected = false;
    redisClient = null;
    logger.info('Redis client closed');
  }
}
