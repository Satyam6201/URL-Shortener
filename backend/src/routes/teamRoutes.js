import express from 'express';
import { getMyTeam, inviteMember, removeMember } from '../controllers/teamController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', getMyTeam);
router.post('/invite', inviteMember);
router.delete('/members/:memberUserId', removeMember);

export default router;
