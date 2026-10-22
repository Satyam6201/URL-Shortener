import express from 'express';
import { listKeys, createKey, revokeKey } from '../controllers/apiKeyController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', listKeys);
router.post('/', createKey);
router.delete('/:key', revokeKey);

export default router;
