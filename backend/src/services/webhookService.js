import crypto from 'node:crypto';
import { Webhook } from '../models/Webhook.js';
import { logger } from '../utils/logger.js';

export async function triggerWebhooks(eventType, payload, userId) {
  if (!userId) return;

  try {
    const webhooks = await Webhook.find({
      userId,
      isActive: true,
      events: eventType,
    });

    if (webhooks.length === 0) return;

    const bodyString = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const requests = webhooks.map(async (wh) => {
      const signature = crypto
        .createHmac('sha256', wh.secret)
        .update(bodyString)
        .digest('hex');

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SnipURL-Event': eventType,
            'X-SnipURL-Signature': signature,
            'User-Agent': 'SnipURL-Webhooks/1.0',
          },
          body: bodyString,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        wh.lastTriggeredAt = new Date();
        wh.lastStatus = res.status;
        await wh.save();
      } catch (err) {
        logger.warn(`Webhook dispatch failed for ${wh.url}: ${err.message}`);
        wh.lastTriggeredAt = new Date();
        wh.lastStatus = 500;
        await wh.save();
      }
    });

    await Promise.allSettled(requests);
  } catch (err) {
    logger.error(`Error in triggerWebhooks: ${err.message}`);
  }
}
