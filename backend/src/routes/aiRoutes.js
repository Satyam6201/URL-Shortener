import express from 'express';
import {
  suggestSlugsHandler,
  checkSafetyHandler,
  categorizeHandler,
} from '../controllers/aiController.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const aiLimiter = createRateLimiter({ max: 30, windowSeconds: 60, keyPrefix: 'ai_ops' });

router.post('/suggest-slugs', aiLimiter, suggestSlugsHandler);
router.post('/analyze-safety', aiLimiter, checkSafetyHandler);
router.post('/categorize', aiLimiter, categorizeHandler);

export default router;
