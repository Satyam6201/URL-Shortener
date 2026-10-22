import express from 'express';
import {
  listWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
} from '../controllers/webhookController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', listWebhooks);
router.post('/', createWebhook);
router.delete('/:id', deleteWebhook);
router.post('/:id/test', testWebhook);

export default router;
