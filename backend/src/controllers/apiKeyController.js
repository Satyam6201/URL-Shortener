import crypto from 'node:crypto';
import { User } from '../models/User.js';

export async function listKeys(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('apiKeys');
    res.json({
      success: true,
      data: user.apiKeys || [],
    });
  } catch (err) {
    next(err);
  }
}

export async function createKey(req, res, next) {
  try {
    const { name = 'Production API Key' } = req.body;
    const rawKey = `snip_live_${crypto.randomBytes(24).toString('hex')}`;

    const user = await User.findById(req.user._id);
    user.apiKeys.push({
      key: rawKey,
      name,
      createdAt: new Date(),
      lastUsedAt: null,
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        key: rawKey,
        name,
        createdAt: new Date(),
      },
      message: 'API Key created successfully. Please store it securely.',
    });
  } catch (err) {
    next(err);
  }
}

export async function revokeKey(req, res, next) {
  try {
    const { key } = req.params;
    const user = await User.findById(req.user._id);
    user.apiKeys = user.apiKeys.filter((k) => k.key !== key);
    await user.save();

    res.json({
      success: true,
      message: 'API Key revoked successfully',
    });
  } catch (err) {
    next(err);
  }
}
