import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { User } from '../backend/src/models/User.js';
import { Url } from '../backend/src/models/Url.js';
import { Click } from '../backend/src/models/Click.js';
import { Counter } from '../backend/src/models/Counter.js';
import { getRedisClient, closeRedis } from '../backend/src/config/redis.js';
import { cacheUrl } from '../backend/src/services/redisService.js';
import { logger } from '../backend/src/utils/logger.js';
import { config } from '../backend/src/config/env.js';

const MONGO_URI = process.env.MONGO_URI || config.mongoUri;

async function seed() {
  logger.info(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);

  logger.info('Purging existing demo seed data...');
  await User.deleteMany({ email: 'demo@example.com' });

  logger.info('Creating demo user...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const demoUser = await User.create({
    name: 'Alex Mercer',
    email: 'demo@example.com',
    passwordHash,
    role: 'user',
    dailyQuota: 100,
  });

  await Counter.findByIdAndUpdate(
    'url_counter',
    { seq: 10000000 },
    { upsert: true, setDefaultsOnInsert: true }
  );

  const redis = getRedisClient();
  try {
    await redis.set('url_counter', 10000000);
    logger.info('Redis atomic url_counter initialized at 10,000,000');
  } catch (err) {
    logger.warn(`Could not set Redis counter directly: ${err.message}`);
  }

  const sampleLinks = [
    {
      shortCode: 'react-guide',
      originalUrl: 'https://react.dev/learn/state-a-components-memory',
      title: 'React 19 State & Memory Documentation',
      category: 'Technology',
      tags: ['react', 'frontend', 'javascript', 'docs'],
      clicksCount: 342,
    },
    {
      shortCode: 'nike-shoes',
      originalUrl: 'https://www.nike.com/t/air-max-plus-mens-shoes-p8M4zr/DZ3531-600',
      title: 'Nike Air Max Plus Running Shoes - Crimson Red Sale',
      category: 'Shopping',
      tags: ['shoes', 'sneakers', 'nike', 'sale', 'promo'],
      clicksCount: 789,
    },
    {
      shortCode: 'ai-news',
      originalUrl: 'https://techcrunch.com/category/artificial-intelligence/',
      title: 'TechCrunch Artificial Intelligence & Autonomous Agents',
      category: 'News',
      tags: ['ai', 'techcrunch', 'news', 'agents'],
      clicksCount: 154,
    },
    {
      shortCode: 'summer-sale',
      originalUrl: 'https://example.com/summer-promotions?ref=twitter_campaign&discount=30',
      title: 'Summer Season 30% Off Storewide Promo',
      category: 'Shopping',
      tags: ['summer', 'promo', 'discount'],
      clicksCount: 520,
    },
    {
      shortCode: 'pod-ep42',
      originalUrl: 'https://spotify.com/episode/scaling-distributed-systems',
      title: 'Scaling Distributed Redis & Node.js Architecture - Episode 42',
      category: 'Entertainment',
      tags: ['podcast', 'architecture', 'spotify'],
      clicksCount: 88,
    },
  ];

  logger.info(`Generating ${sampleLinks.length} sample links...`);
  const createdUrls = [];

  for (const item of sampleLinks) {
    await Url.deleteMany({ shortCode: item.shortCode });
    await Click.deleteMany({ shortCode: item.shortCode });

    const shortUrl = `${config.baseUrl}/${item.shortCode}`;
    const qrCodeData = await QRCode.toDataURL(shortUrl, { width: 250 });

    const urlDoc = await Url.create({
      shortCode: item.shortCode,
      originalUrl: item.originalUrl,
      userId: demoUser._id,
      customAlias: item.shortCode,
      title: item.title,
      category: item.category,
      tags: item.tags,
      clicksCount: item.clicksCount,
      aiSafety: {
        isSafe: true,
        riskScore: 0,
        riskCategory: 'clean',
        reasons: ['Domain verified authentic'],
      },
      qrCodeData,
    });

    createdUrls.push(urlDoc);

    await cacheUrl(item.shortCode, {
      _id: urlDoc._id.toString(),
      shortCode: urlDoc.shortCode,
      originalUrl: urlDoc.originalUrl,
      isActive: true,
      expiresAt: null,
    });
  }

  logger.info('Generating rich click telemetry for analytics visualization...');
  const countries = ['US', 'US', 'US', 'IN', 'IN', 'GB', 'DE', 'CA', 'FR', 'JP', 'AU', 'BR'];
  const devices = ['mobile', 'mobile', 'mobile', 'desktop', 'desktop', 'tablet'];
  const browsers = ['Chrome', 'Chrome', 'Safari', 'Safari', 'Firefox', 'Edge'];
  const referrers = ['Direct', 'Direct', 'twitter.com', 'google.com', 'linkedin.com', 'reddit.com', 't.co'];

  const clickRecords = [];
  const now = Date.now();

  for (const urlDoc of createdUrls) {
    const numClicks = urlDoc.clicksCount;
    for (let i = 0; i < numClicks; i++) {
      const daysAgo = Math.random() * 14;
      const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

      clickRecords.push({
        urlId: urlDoc._id,
        shortCode: urlDoc.shortCode,
        timestamp,
        ipHash: `anon_${Math.floor(Math.random() * 1000)}`,
        country: countries[Math.floor(Math.random() * countries.length)],
        city: 'Sample City',
        device: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        os: 'Modern OS',
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        userAgent: 'Mozilla/5.0 Demo Browser',
      });
    }
  }

  await Click.insertMany(clickRecords, { ordered: false });
  logger.info(`Inserted ${clickRecords.length} granular click records across links.`);

  logger.info('----------------------------------------------------');
  logger.info('Seed completed successfully!');
  logger.info('Demo Credentials:');
  logger.info('  Email:    demo@example.com');
  logger.info('  Password: password123');
  logger.info('----------------------------------------------------');

  await closeRedis();
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  logger.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
