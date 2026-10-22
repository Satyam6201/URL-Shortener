import { Queue } from 'bullmq';
import { config } from '../config/env.js';
import { isRedisAvailable } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { Click } from '../models/Click.js';
import { Url } from '../models/Url.js';

export const QUEUE_NAME = 'click-analytics';

let clickQueue = null;
const fallbackMemoryBuffer = [];
let fallbackFlushInterval = null;

export function getClickQueue() {
  if (clickQueue) return clickQueue;

  try {
    const url = new URL(config.redisUrl);
    clickQueue = new Queue(QUEUE_NAME, {
      connection: {
        host: url.hostname || 'localhost',
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        username: url.username || undefined,
      },
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 500,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    clickQueue.on('error', (err) => {
      logger.warn(`Click Queue error: ${err.message}`);
    });

    return clickQueue;
  } catch (err) {
    logger.error(`Failed to initialize BullMQ queue: ${err.message}`);
    return null;
  }
}

async function flushFallbackBuffer() {
  if (fallbackMemoryBuffer.length === 0) return;

  const batch = fallbackMemoryBuffer.splice(0, fallbackMemoryBuffer.length);
  try {
    await Click.insertMany(batch, { ordered: false });

    const countsByUrl = {};
    for (const item of batch) {
      countsByUrl[item.urlId] = (countsByUrl[item.urlId] || 0) + 1;
    }
    const promises = Object.entries(countsByUrl).map(([urlId, count]) =>
      Url.findByIdAndUpdate(urlId, { $inc: { clicksCount: count } })
    );
    await Promise.all(promises);
    logger.info(`Flushed ${batch.length} buffered clicks directly to MongoDB`);
  } catch (err) {
    logger.error(`Fallback buffer flush error: ${err.message}`);
  }
}

if (!fallbackFlushInterval) {
  fallbackFlushInterval = setInterval(flushFallbackBuffer, 5000);
  if (fallbackFlushInterval.unref) fallbackFlushInterval.unref();
}

export async function enqueueClick(clickData) {
  if (isRedisAvailable()) {
    try {
      const queue = getClickQueue();
      if (queue) {
        await queue.add('process-click', clickData);
        return;
      }
    } catch (err) {
      logger.warn(`Failed to push to BullMQ, using memory buffer fallback: ${err.message}`);
    }
  }

  fallbackMemoryBuffer.push(clickData);
  if (fallbackMemoryBuffer.length >= 50) {
    flushFallbackBuffer().catch(() => {});
  }
}

export async function closeQueue() {
  if (clickQueue) {
    await clickQueue.close();
    clickQueue = null;
  }
  if (fallbackFlushInterval) {
    clearInterval(fallbackFlushInterval);
  }
  await flushFallbackBuffer();
}
