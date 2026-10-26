import { Worker } from 'bullmq';
import { config } from '../config/env.js';
import { connectDB, closeDB } from '../config/db.js';
import { Click } from '../models/Click.js';
import { Url } from '../models/Url.js';
import { QUEUE_NAME } from '../services/queueService.js';
import { logger } from '../utils/logger.js';

let worker = null;

export function startWorker() {
  if (worker) return worker;

  const url = new URL(config.redisUrl);
  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const clickData = job.data;
      if (!clickData || !clickData.urlId) return { status: 'skipped' };

      await Click.create(clickData);
      await Url.findByIdAndUpdate(clickData.urlId, { $inc: { clicksCount: 1 } });

      return { status: 'processed', urlId: clickData.urlId };
    },
    {
      connection: {
        host: url.hostname || 'localhost',
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        username: url.username || undefined,
      },
      concurrency: 25,
    }
  );

  worker.on('completed', (job) => {
    logger.debug(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.warn(`Worker Redis connection error: ${err.message}`);
  });

  logger.info('BullMQ Click Analytics Worker initialized and listening');
  return worker;
}

export async function stopWorker() {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('BullMQ Worker closed');
  }
}

if (process.argv[1] && process.argv[1].endsWith('clickWorker.js')) {
  (async () => {
    logger.info('Starting standalone BullMQ Click Worker process...');
    await connectDB();
    startWorker();

    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down worker gracefully...`);
      await stopWorker();
      await closeDB();
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  })().catch((err) => {
    logger.fatal(`Fatal worker startup error: ${err.message}`);
    process.exit(1);
  });
}
