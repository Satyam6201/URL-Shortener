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

const router = express.Router();

router.post('/abuse', reportAbuseHandler);

router.use(requireAuth, requireAdmin);
router.get('/stats', getAdminStats);
router.get('/users', listAdminUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/abuse', listAbuseReports);
router.post('/abuse/:id/action', actionAbuseReport);

export default router;
