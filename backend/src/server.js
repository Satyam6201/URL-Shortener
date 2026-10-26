import { app } from './app.js';
import { config } from './config/env.js';
import { connectDB, closeDB } from './config/db.js';
import { getRedisClient, closeRedis } from './config/redis.js';
import { getClickQueue, closeQueue } from './services/queueService.js';
import { startWorker, stopWorker } from './workers/clickWorker.js';
import { logger } from './utils/logger.js';

let server = null;

async function bootstrap() {
  try {
    if (config.env === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'url-shortener-super-secret-jwt-key-2026')) {
      logger.fatal('FATAL SECURITY ERROR: In production, a secure unique JWT_SECRET must be explicitly provided.');
      process.exit(1);
    }

    logger.info('Initializing URL Shortener services...');

    await connectDB();

    getRedisClient();

    getClickQueue();

    if (process.env.RUN_IN_PROCESS_WORKER === 'true' || config.env === 'development') {
      startWorker();
      logger.info('Embedded in-process Click Worker started');
    }

    server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`URL Shortener API Server listening on http://0.0.0.0:${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Base Short URL: ${config.baseUrl}`);
      logger.info(`Prometheus Metrics available at: ${config.baseUrl}/metrics`);
      logger.info(`Health check available at: ${config.baseUrl}/health`);
    });
  } catch (err) {
    logger.fatal(`Failed to bootstrap server: ${err.message}`);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Commencing graceful server shutdown...`);

  if (server) {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) logger.warn(`Error closing HTTP server: ${err.message}`);
        else logger.info('HTTP server closed cleanly');
        resolve();
      });
    });
  }

  try {
    await stopWorker();
    await closeQueue();
    await closeRedis();
    await closeDB();
    logger.info('All connections cleanly terminated. Exiting process.');
    process.exit(0);
  } catch (err) {
    logger.error(`Error during graceful shutdown: ${err.message}`);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

bootstrap();
