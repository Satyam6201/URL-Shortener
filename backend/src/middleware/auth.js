import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      const userWithKey = await User.findOne({ 'apiKeys.key': apiKey, isActive: true });
      if (userWithKey) {
        User.updateOne(
          { _id: userWithKey._id, 'apiKeys.key': apiKey },
          { $set: { 'apiKeys.$.lastUsedAt': new Date() } }
        ).catch(() => {});
        req.user = userWithKey;
        req.authType = 'api_key';
        return next();
      }
      return res.status(401).json({ success: false, error: 'Invalid or revoked API Key' });
    }

    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token && token.startsWith('snip_live_')) {
      const userWithKey = await User.findOne({ 'apiKeys.key': token, isActive: true });
      if (userWithKey) {
        req.user = userWithKey;
        req.authType = 'api_key';
        return next();
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in or provide an API Key.',
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account is invalid or deactivated.',
      });
    }

    req.user = user;
    req.authType = 'jwt';
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication credentials.',
    });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      const userWithKey = await User.findOne({ 'apiKeys.key': apiKey, isActive: true });
      if (userWithKey) {
        req.user = userWithKey;
        return next();
      }
    }

    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      if (token.startsWith('snip_live_')) {
        const userWithKey = await User.findOne({ 'apiKeys.key': token, isActive: true });
        if (userWithKey) {
          req.user = userWithKey;
          return next();
        }
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch {}
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Administrator access required for this operation',
    });
  }
  next();
}
