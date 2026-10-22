import {
  generateSmartSlugs,
  scanUrlSafety,
  categorizeUrl,
  extractPageMetadata,
} from '../services/aiService.js';
import { validateUrlSecurity } from '../utils/ssrfValidator.js';

export async function suggestSlugsHandler(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'url is required' });
    }

    const security = await validateUrlSecurity(url);
    if (!security.isValid) {
      return res.status(400).json({ success: false, error: security.reason });
    }

    const meta = await extractPageMetadata(url);
    const slugs = await generateSmartSlugs(url, meta.title);

    res.json({
      success: true,
      data: {
        slugs,
        meta,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function checkSafetyHandler(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'url is required' });
    }

    const security = await validateUrlSecurity(url);
    if (!security.isValid) {
      return res.status(400).json({
        success: false,
        error: security.reason,
        data: {
          isSafe: false,
          riskScore: 100,
          riskCategory: 'ssrf_prohibited',
          reasons: [security.reason],
        },
      });
    }

    const safety = await scanUrlSafety(url);

    res.json({
      success: true,
      data: safety,
    });
  } catch (err) {
    next(err);
  }
}

export async function categorizeHandler(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'url is required' });
    }

    const categorization = await categorizeUrl(url);

    res.json({
      success: true,
      data: categorization,
    });
  } catch (err) {
    next(err);
  }
}
