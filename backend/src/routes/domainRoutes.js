import express from 'express';
import {
  listDomains,
  addDomain,
  verifyDomain,
  deleteDomain,
} from '../controllers/domainController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', listDomains);
router.post('/', addDomain);
router.post('/:id/verify', verifyDomain);
router.delete('/:id', deleteDomain);

export default router;
