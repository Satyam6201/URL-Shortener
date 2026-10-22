import express from 'express';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const authLimiter = createRateLimiter({ max: 10, windowSeconds: 60, keyPrefix: 'auth' });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

export default router;
