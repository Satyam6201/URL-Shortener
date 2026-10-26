import crypto from 'node:crypto';
import { User } from '../models/User.js';

export async function listKeys(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('apiKeys');
    const safeKeys = (user.apiKeys || []).map((k) => {
      const displayKey = k.keyPreview || (k.key ? `${k.key.slice(0, 14)}...${k.key.slice(-4)}` : 'snip_live_...');
      return {
        key: displayKey,
        keyPreview: displayKey,
        keyIdentifier: k.keyHash || k.key,
        name: k.name,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
      };
    });

    res.json({
      success: true,
      data: safeKeys,
    });
  } catch (err) {
    next(err);
  }
}

export async function createKey(req, res, next) {
  try {
    const { name = 'Production API Key' } = req.body;
    const rawKey = `snip_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPreview = `${rawKey.slice(0, 14)}...${rawKey.slice(-4)}`;

    const user = await User.findById(req.user._id);
    user.apiKeys.push({
      keyHash,
      keyPreview,
      name,
      createdAt: new Date(),
      lastUsedAt: null,
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        key: rawKey,
        keyPreview,
        name,
        createdAt: new Date(),
      },
      message: 'API Key created successfully. Please store it securely now as it will not be displayed again.',
    });
  } catch (err) {
    next(err);
  }
}

export async function revokeKey(req, res, next) {
  try {
    const { key } = req.params;
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const user = await User.findById(req.user._id);

    user.apiKeys = user.apiKeys.filter((k) =>
      k.key !== key &&
      k.keyHash !== key &&
      k.keyHash !== keyHash &&
      k.keyPreview !== key
    );
    await user.save();

    res.json({
      success: true,
      message: 'API Key revoked successfully',
    });
  } catch (err) {
    next(err);
  }
}
