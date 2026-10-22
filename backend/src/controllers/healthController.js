import { isMongoConnected } from '../config/db.js';
import { isRedisAvailable } from '../config/redis.js';

export function getHealth(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

export function getReadiness(req, res) {
  const mongoOk = isMongoConnected();
  const redisOk = isRedisAvailable();

  const isReady = mongoOk;

  const status = isReady ? 200 : 503;
  res.status(status).json({
    status: isReady ? 'ready' : 'not_ready',
    services: {
      mongodb: mongoOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'degraded (fallback active)',
    },
    timestamp: new Date().toISOString(),
  });
}

export function getLiveness(req, res) {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}
