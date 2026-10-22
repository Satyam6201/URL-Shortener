import * as cheerio from 'cheerio';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { validateUrlSecurity, RESERVED_SLUGS } from '../utils/ssrfValidator.js';

const SUSPICIOUS_TLDS = new Set([
  'zip', 'review', 'country', 'kim', 'cricket', 'science', 'work',
  'party', 'gq', 'cf', 'ml', 'tk', 'ga', 'top', 'xyz', 'click'
]);

const PHISHING_KEYWORDS = [
  'paypal-verify', 'bank-secure', 'login-attempt', 'account-confirm',
  'update-billing', 'security-alert', 'signin-auth', 'wallet-connect',
  'claim-reward', 'gift-free', 'verify-identity', 'auth-check'
];

const BRAND_PATTERNS = [
  /paypa[l1i]/i,
  /goog[l1]e/i,
  /micros[o0]ft/i,
  /app[l1]e/i,
  /faceb[o0][o0]k/i,
  /netf[l1]ix/i,
  /amaz[o0]n/i,
  /binance/i,
  /coinbase/i
];

async function callGemini(prompt) {
  if (!config.geminiApiKey) return null;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${config.geminiApiKey}`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } else {
      const errData = await res.json().catch(() => ({}));
      logger.warn(`Gemini API error [${res.status}]: ${errData.error?.message || res.statusText}`);
      return null;
    }
  } catch (err) {
    logger.warn(`Gemini request failed: ${err.message}`);
    return null;
  }
}

function calculateEntropy(str) {
  if (!str) return 0;
  const len = str.length;
  const frequencies = {};
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export async function scanUrlSafety(urlString) {
  const reasons = [];
  let riskScore = 0;

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch (e) {
    return {
      isSafe: false,
      riskScore: 100,
      riskCategory: 'malformed_url',
      reasons: ['URL syntax is invalid'],
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();
  const fullUrl = urlString.toLowerCase();

  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    riskScore += 45;
    reasons.push('Direct numeric IP address used as hostname instead of a registered domain');
  }

  const domainParts = hostname.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (SUSPICIOUS_TLDS.has(tld)) {
    riskScore += 25;
    reasons.push(`High-risk top-level domain (.${tld}) commonly associated with phishing`);
  }

  if (domainParts.length > 4) {
    riskScore += 20;
    reasons.push('Excessive subdomain nesting detected (potential domain spoofing)');
  }

  for (const kw of PHISHING_KEYWORDS) {
    if (fullUrl.includes(kw)) {
      riskScore += 40;
      reasons.push(`Detected phishing keyword signature: "${kw}"`);
      break;
    }
  }

  for (const pattern of BRAND_PATTERNS) {
    if (pattern.test(hostname)) {
      const isGenuine =
        hostname.endsWith('paypal.com') ||
        hostname.endsWith('google.com') ||
        hostname.endsWith('microsoft.com') ||
        hostname.endsWith('apple.com') ||
        hostname.endsWith('facebook.com') ||
        hostname.endsWith('netflix.com') ||
        hostname.endsWith('amazon.com') ||
        hostname.endsWith('binance.com') ||
        hostname.endsWith('coinbase.com');

      if (!isGenuine) {
        riskScore += 50;
        reasons.push(`Possible homograph or brand spoofing attempt matching brand signature`);
        break;
      }
    }
  }

  const entropy = calculateEntropy(pathname);
  if (pathname.length > 20 && entropy > 4.5) {
    riskScore += 20;
    reasons.push('High character entropy in URL path indicative of obfuscated script or exploit');
  }

  if (config.googleSafeBrowsingKey) {
    try {
      const gsbEndpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${config.googleSafeBrowsingKey}`;
      const payload = {
        client: { clientId: 'url-shortener-app', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: urlString }],
        },
      };

      const res = await fetch(gsbEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.matches && data.matches.length > 0) {
          riskScore = 100;
          const threatType = data.matches[0].threatType;
          reasons.push(`Flagged by Google Safe Browsing as ${threatType}`);
        }
      }
    } catch (gsbErr) {
      logger.warn(`Google Safe Browsing lookup error: ${gsbErr.message}`);
    }
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskCategory = 'clean';
  if (riskScore >= 70) riskCategory = 'malicious';
  else if (riskScore >= 35) riskCategory = 'suspicious';
  else if (riskScore > 0) riskCategory = 'low_risk';

  const isSafe = riskScore < 70;

  return {
    isSafe,
    riskScore,
    riskCategory,
    reasons: reasons.length > 0 ? reasons : ['No known malicious signatures or anomalies detected'],
  };
}

export async function extractPageMetadata(urlString) {
  try {
    const security = await validateUrlSecurity(urlString);
    if (!security.isValid) {
      return { title: '', description: '', domain: '' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(urlString, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 URLShortenerBot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const u = new URL(urlString);
      return { title: u.pathname.replace(/[^a-zA-Z0-9]/g, ' ').trim(), description: '', domain: u.hostname };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      '';

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    const u = new URL(urlString);
    return { title: title.slice(0, 200), description: description.slice(0, 300), domain: u.hostname };
  } catch (err) {
    try {
      const u = new URL(urlString);
      return { title: '', description: '', domain: u.hostname };
    } catch {
      return { title: '', description: '', domain: '' };
    }
  }
}

export async function generateSmartSlugs(urlString, pageTitle = '') {
  let meta = { title: pageTitle, description: '', domain: '' };
  if (!pageTitle) {
    meta = await extractPageMetadata(urlString);
  }

  const u = new URL(urlString);
  const pathParts = u.pathname.split('/').filter(p => p.length > 2 && !/\.html?$/i.test(p));

  if (config.geminiApiKey) {
    const prompt = `You are a URL slug generation specialist. Generate 4 concise, punchy, memorable kebab-case slugs (2 to 4 words each, lowercase, hyphens and numbers only) for this URL:
URL: ${urlString}
Page Title: ${meta.title || pathParts.join(' ')}
Description: ${meta.description}

Output ONLY a raw JSON array of 4 strings (e.g. ["react-hooks-guide", "nike-air-max-sale", "quickstart-tutorial"]). No markdown code blocks, no explanations.`;

    const geminiOutput = await callGemini(prompt);
    if (geminiOutput) {
      try {
        const cleaned = geminiOutput.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated = parsed
            .map(s => String(s).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40))
            .filter(s => s.length >= 3 && !RESERVED_SLUGS.has(s));
          if (validated.length > 0) {
            return validated;
          }
        }
      } catch (parseErr) {
        logger.debug(`Could not parse Gemini JSON slugs: ${parseErr.message}`);
      }
    }
  }

  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about',
    'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from',
    'up', 'down', 'of', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
    'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can',
    'will', 'just', 'should', 'now', 'is', 'it', 'its', 'this', 'that', 'our', 'your', 'com', 'org',
    'net', 'www', 'html', 'php', 'aspx', 'index'
  ]);

  const rawText = `${meta.title} ${pathParts.join(' ')} ${u.hostname.replace(/\.[a-z]+$/, '')}`;
  const words = rawText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));

  const uniqueWords = [...new Set(words)];
  const suggestions = [];

  if (uniqueWords.length >= 2) {
    suggestions.push(uniqueWords.slice(0, 3).join('-'));
    if (uniqueWords.length >= 4) {
      suggestions.push(`${uniqueWords[0]}-${uniqueWords[2]}-${uniqueWords[3]}`);
    } else {
      suggestions.push(`${uniqueWords.slice(0, 2).join('-')}-link`);
    }
    suggestions.push(`${uniqueWords[1]}-${uniqueWords[0]}`);
    suggestions.push(`${uniqueWords.slice(0, 2).join('-')}-hub`);
  } else if (uniqueWords.length === 1) {
    suggestions.push(`${uniqueWords[0]}-guide`);
    suggestions.push(`${uniqueWords[0]}-link`);
    suggestions.push(`go-${uniqueWords[0]}`);
    suggestions.push(`${uniqueWords[0]}-portal`);
  } else {
    const domainClean = u.hostname.replace(/^www\./, '').split('.')[0];
    suggestions.push(`${domainClean}-link`);
    suggestions.push(`${domainClean}-share`);
    suggestions.push(`${domainClean}-page`);
    suggestions.push(`go-${domainClean}`);
  }

  return suggestions
    .map(s => s.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40))
    .filter(s => s.length >= 3 && !RESERVED_SLUGS.has(s));
}

export async function categorizeUrl(urlString, title = '') {
  let meta = { title, description: '', domain: '' };
  if (!title) {
    meta = await extractPageMetadata(urlString);
  }

  const u = new URL(urlString);
  const text = `${urlString} ${meta.title} ${meta.description}`.toLowerCase();

  const categories = {
    'Technology': ['github', 'stackoverflow', 'npm', 'python', 'javascript', 'react', 'node', 'api', 'code', 'cloud', 'dev', 'linux', 'software', 'tech', 'ai', 'database', 'docker'],
    'Shopping': ['amazon', 'ebay', 'walmart', 'etsy', 'store', 'shop', 'buy', 'product', 'deal', 'discount', 'cart', 'shoes', 'clothing', 'order', 'sale'],
    'News': ['cnn', 'bbc', 'nytimes', 'reuters', 'guardian', 'news', 'article', 'breaking', 'report', 'press', 'daily'],
    'Social Media': ['twitter', 'x.com', 'linkedin', 'instagram', 'facebook', 'reddit', 'tiktok', 'youtube', 'pinterest', 'threads'],
    'Education': ['edu', 'coursera', 'udemy', 'tutorial', 'course', 'school', 'learn', 'university', 'study', 'academy', 'guide'],
    'Finance': ['bank', 'stripe', 'paypal', 'crypto', 'invest', 'stock', 'finance', 'wallet', 'bitcoin', 'fund', 'trading', 'loan'],
    'Entertainment': ['netflix', 'spotify', 'movie', 'game', 'music', 'stream', 'twitch', 'video', 'podcast', 'tv'],
  };

  let bestCategory = 'General';
  let maxMatches = 0;
  const matchedTags = new Set();

  for (const [cat, keywords] of Object.entries(categories)) {
    let matches = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        matches++;
        matchedTags.add(kw);
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = cat;
    }
  }

  const tags = Array.from(matchedTags).slice(0, 5);
  if (tags.length === 0) {
    const domainClean = u.hostname.replace(/^www\./, '').split('.')[0];
    if (domainClean) tags.push(domainClean);
  }

  return {
    category: bestCategory,
    tags,
  };
}

export async function generateAnalyticsInsights(analyticsData) {
  const { totalClicks, countries = [], devices = [], browsers = [], referrers = [] } = analyticsData;

  if (!totalClicks || totalClicks === 0) {
    return {
      summary: 'No click telemetry recorded yet for this link.',
      highlights: ['Share your short link to start capturing real-time visitor insights.'],
      recommendation: 'Test your link or share it on social channels to begin audience analysis.',
    };
  }

  const topCountry = countries[0]?.country || 'Unknown';
  const topCountryShare = countries[0] ? Math.round((countries[0].count / totalClicks) * 100) : 0;

  const topDevice = devices[0]?.device || 'desktop';
  const topDeviceShare = devices[0] ? Math.round((devices[0].count / totalClicks) * 100) : 0;

  const topReferrer = referrers[0]?.referrer || 'Direct';
  const topReferrerShare = referrers[0] ? Math.round((referrers[0].count / totalClicks) * 100) : 0;

  const topBrowser = browsers[0]?.browser || 'Unknown';

  if (config.geminiApiKey) {
    const prompt = `You are a digital marketing and web analytics strategist. Analyze this URL shortener traffic data:
- Total Clicks: ${totalClicks}
- Top Devices: ${JSON.stringify(devices.slice(0, 3))}
- Top Countries: ${JSON.stringify(countries.slice(0, 3))}
- Top Referrers: ${JSON.stringify(referrers.slice(0, 3))}
- Top Browsers: ${JSON.stringify(browsers.slice(0, 3))}

Produce an executive insights object in exact JSON format:
{
  "summary": "1-sentence executive summary of audience performance",
  "highlights": ["3 bullet points highlighting device split, top geographic drivers, and referral channels"],
  "recommendation": "1 specific actionable optimization recommendation for the link owner"
}
Output ONLY raw JSON. No markdown backticks.`;

    const geminiOutput = await callGemini(prompt);
    if (geminiOutput) {
      try {
        const cleaned = geminiOutput.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.summary && Array.isArray(parsed.highlights) && parsed.recommendation) {
          return parsed;
        }
      } catch (parseErr) {
        logger.debug(`Could not parse Gemini JSON insights: ${parseErr.message}`);
      }
    }
  }

  const highlights = [];
  highlights.push(`${topDeviceShare}% of traffic originates from ${topDevice} users (${topBrowser} browser preferred).`);
  highlights.push(`Top geographic driver is ${topCountry}, accounting for ${topCountryShare}% of all visits.`);
  highlights.push(`Primary referral source is ${topReferrer} (${topReferrerShare}% of total traffic).`);

  let recommendation = '';
  if (topDevice === 'mobile') {
    recommendation = `Ensure your destination page is heavily optimized for mobile viewports, as ${topDeviceShare}% of visitors access on smartphones.`;
  } else if (topReferrer !== 'Direct') {
    recommendation = `Strong traction on ${topReferrer}. Consider running follow-up campaigns and UTM tagging on this channel.`;
  } else {
    recommendation = `Direct traffic dominates (${topReferrerShare}%). Consider expanding distribution via newsletters and social channels.`;
  }

  const summary = `Link has generated ${totalClicks} total clicks with strong engagement primarily from ${topDevice} users in ${topCountry}.`;

  return {
    summary,
    highlights,
    recommendation,
  };
}
