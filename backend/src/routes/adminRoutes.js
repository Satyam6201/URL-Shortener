import express from 'express';
import {
  getAdminStats,
  listAdminUsers,
  toggleUserStatus,
  listAbuseReports,
  actionAbuseReport,
  reportAbuseHandler,
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const abuseLimiter = createRateLimiter({ max: 5, windowSeconds: 60, keyPrefix: 'abuse_report' });

router.post('/abuse', abuseLimiter, reportAbuseHandler);

router.use(requireAuth, requireAdmin);
router.get('/stats', getAdminStats);
router.get('/users', listAdminUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/abuse', listAbuseReports);
router.post('/abuse/:id/action', actionAbuseReport);

export default router;
