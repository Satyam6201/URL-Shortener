import { Worker } from 'bullmq';
import { config } from '../config/env.js';
import { connectDB, closeDB } from '../config/db.js';
import { Click } from '../models/Click.js';
import { Url } from '../models/Url.js';
import { QUEUE_NAME } from '../services/queueService.js';
import { logger } from '../utils/logger.js';

let worker = null;

const BATCH_SIZE = 25;
const FLUSH_INTERVAL_MS = 2000;
let pendingBatch = [];
let flushTimeout = null;

async function flushBatch() {
  if (pendingBatch.length === 0) return;

  const currentBatch = pendingBatch.splice(0, pendingBatch.length);
  try {

    await Click.insertMany(currentBatch, { ordered: false });

    const countsByUrl = {};
    for (const item of currentBatch) {
      if (item.urlId) {
        countsByUrl[item.urlId] = (countsByUrl[item.urlId] || 0) + 1;
      }
    }

    const updatePromises = Object.entries(countsByUrl).map(([urlId, count]) =>
      Url.findByIdAndUpdate(urlId, { $inc: { clicksCount: count } })
    );

    await Promise.all(updatePromises);
    logger.info(`Worker successfully processed and flushed ${currentBatch.length} clicks`);
  } catch (err) {
    logger.error(`Error flushing batch clicks in worker: ${err.message}`);
  }
}

export function startWorker() {
  if (worker) return worker;

  const url = new URL(config.redisUrl);
  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const clickData = job.data;
      pendingBatch.push(clickData);

      if (pendingBatch.length >= BATCH_SIZE) {
        if (flushTimeout) clearTimeout(flushTimeout);
        await flushBatch();
      } else if (!flushTimeout) {
        flushTimeout = setTimeout(() => {
          flushTimeout = null;
          flushBatch().catch(() => {});
        }, FLUSH_INTERVAL_MS);
      }

      return { status: 'batched' };
    },
    {
      connection: {
        host: url.hostname || 'localhost',
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        username: url.username || undefined,
      },
      concurrency: 10,
    }
  );

  worker.on('completed', (job) => {
    logger.debug(`Job ${job.id} completed`);
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
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  await flushBatch();

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
