import test from 'node:test';
import assert from 'node:assert/strict';
import {
  scanUrlSafety,
  generateSmartSlugs,
  categorizeUrl,
  generateAnalyticsInsights,
} from '../src/services/aiService.js';

test('AI Malicious Link Detection', async (t) => {
  await t.test('flags raw IP address in URL', async () => {
    const scan = await scanUrlSafety('http://198.51.100.12/update');
    assert.ok(scan.riskScore > 30);
    assert.ok(scan.reasons.some(r => r.includes('IP address')));
  });

  await t.test('flags phishing keyword patterns', async () => {
    const scan = await scanUrlSafety('https://secure-login-attempt-update.com/verify');
    assert.ok(scan.riskScore >= 40);
    assert.ok(scan.reasons.some(r => r.includes('phishing keyword signature')));
  });

  await t.test('flags suspicious top-level domains', async () => {
    const scan = await scanUrlSafety('https://free-prizes-claim.zip/download');
    assert.ok(scan.riskScore >= 25);
  });

  await t.test('passes legitimate trusted URLs', async () => {
    const scan = await scanUrlSafety('https://github.com/torvalds/linux');
    assert.equal(scan.isSafe, true);
    assert.equal(scan.riskCategory, 'clean');
  });
});

test('AI Smart Slug Suggestion', async (t) => {
  await t.test('generates readable kebab-case slugs from title and path', async () => {
    const slugs = await generateSmartSlugs('https://example.com/shoes/red-running-sneakers', 'Red Running Shoes For Men');
    assert.ok(Array.isArray(slugs));
    assert.ok(slugs.length >= 2);
    for (const slug of slugs) {
      assert.match(slug, /^[a-z0-9-]+$/);
    }
  });
});

test('AI URL Categorization', async (t) => {
  await t.test('categorizes technology links', async () => {
    const result = await categorizeUrl('https://github.com/facebook/react', 'React - A JavaScript library for building user interfaces');
    assert.equal(result.category, 'Technology');
    assert.ok(result.tags.includes('react') || result.tags.includes('javascript') || result.tags.includes('github'));
  });

  await t.test('categorizes shopping links', async () => {
    const result = await categorizeUrl('https://amazon.com/products/shoes-sale-discount', 'Nike Running Shoes Special Discount Sale');
    assert.equal(result.category, 'Shopping');
  });
});

test('AI Analytics Insights Generator', async (t) => {
  await t.test('generates coherent narrative from metrics', async () => {
    const mockData = {
      totalClicks: 240,
      uniqueVisitors: 190,
      countries: [{ country: 'US', count: 120 }, { country: 'IN', count: 60 }],
      devices: [{ device: 'mobile', count: 160 }, { device: 'desktop', count: 80 }],
      browsers: [{ browser: 'Chrome', count: 150 }],
      referrers: [{ referrer: 'twitter.com', count: 110 }],
    };

    const insights = await generateAnalyticsInsights(mockData);
    assert.ok(insights.summary.includes('240 total clicks'));
    assert.ok(insights.highlights.length > 0);
    assert.ok(typeof insights.recommendation === 'string' && insights.recommendation.length > 10);
  });
});
