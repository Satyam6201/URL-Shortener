import express from 'express';
import {
  getUrlAnalytics,
  getDashboardOverview,
  exportCsv,
  exportOverviewCsv,
  streamRealtimeClicks,
  askAiNaturalLanguage,
} from '../controllers/analyticsController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/stream', optionalAuth, streamRealtimeClicks);
router.post('/ask-ai', optionalAuth, askAiNaturalLanguage);
router.get('/overview/export/csv', requireAuth, exportOverviewCsv);
router.get('/overview', requireAuth, getDashboardOverview);
router.get('/:shortCode/export/csv', optionalAuth, exportCsv);
router.get('/:shortCode', optionalAuth, getUrlAnalytics);

export default router;
