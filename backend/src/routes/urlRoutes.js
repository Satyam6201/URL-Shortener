import express from 'express';
import {
  createUrl,
  bulkCreateUrls,
  listUrls,
  getUrlById,
  updateUrlHandler,
  deleteUrlHandler,
  getUserQuota,
} from '../controllers/urlController.js';
import { verifyPassword, getLinkPreview } from '../controllers/redirectController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { createRateLimiter, dailyQuotaLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const createLimiter = createRateLimiter({ max: 30, windowSeconds: 60, keyPrefix: 'create_url' });

router.post('/', optionalAuth, createLimiter, dailyQuotaLimiter, createUrl);
router.post('/bulk', requireAuth, createLimiter, bulkCreateUrls);
router.post('/verify-password', verifyPassword);
router.get('/preview/:shortCode', getLinkPreview);
router.get('/quota', optionalAuth, getUserQuota);

router.get('/', requireAuth, listUrls);
router.get('/:id', requireAuth, getUrlById);
router.patch('/:id', requireAuth, updateUrlHandler);
router.delete('/:id', requireAuth, deleteUrlHandler);

export default router;
