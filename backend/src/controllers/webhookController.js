import crypto from 'node:crypto';
import { Webhook } from '../models/Webhook.js';
import { validateUrlSecurity } from '../utils/ssrfValidator.js';

export async function listWebhooks(req, res, next) {
  try {
    const webhooks = await Webhook.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: webhooks,
    });
  } catch (err) {
    next(err);
  }
}

export async function createWebhook(req, res, next) {
  try {
    const { url, events } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ success: false, error: 'A valid HTTP/HTTPS webhook URL is required' });
    }

    const security = await validateUrlSecurity(url);
    if (!security.isValid) {
      return res.status(400).json({ success: false, error: `Invalid webhook destination: ${security.reason}` });
    }

    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const webhook = await Webhook.create({
      userId: req.user._id,
      url,
      events: events && events.length > 0 ? events : ['link.clicked'],
      secret,
    });

    res.status(201).json({
      success: true,
      data: webhook,
      message: 'Webhook endpoint registered successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteWebhook(req, res, next) {
  try {
    await Webhook.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Webhook deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function testWebhook(req, res, next) {
  try {
    const webhook = await Webhook.findOne({ _id: req.params.id, userId: req.user._id });
    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    const security = await validateUrlSecurity(webhook.url);
    if (!security.isValid) {
      return res.status(400).json({ success: false, error: `Target URL is unsafe: ${security.reason}` });
    }

    const testPayload = JSON.stringify({
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      data: { message: 'Test webhook dispatch from SnipURL' },
    });

    const signature = crypto.createHmac('sha256', webhook.secret).update(testPayload).digest('hex');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const pingRes = await fetch(webhook.url, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        'X-SnipURL-Event': 'test.ping',
        'X-SnipURL-Signature': signature,
        'User-Agent': 'SnipURL-Webhooks/1.0',
      },
      body: testPayload,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    webhook.lastTriggeredAt = new Date();
    webhook.lastStatus = pingRes.status;
    await webhook.save();

    res.json({
      success: true,
      statusCode: pingRes.status,
      message: `Test ping delivered with HTTP ${pingRes.status}`,
    });
  } catch (err) {
    res.status(502).json({
      success: false,
      error: `Webhook delivery test failed: ${err.message}`,
    });
  }
}
