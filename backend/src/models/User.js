import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const apiKeySchema = new mongoose.Schema(
  {
    key: { type: String, default: null },
    keyHash: { type: String, default: null },
    keyPreview: { type: String, default: null },
    name: { type: String, default: 'Default API Key' },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'business'],
      default: 'pro',
    },
    dailyQuota: {
      type: Number,
      default: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    twoFactorSecret: {
      type: String,
      default: null,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    apiKeys: {
      type: [apiKeySchema],
      default: [],
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ 'apiKeys.keyHash': 1 }, { unique: true, sparse: true });
userSchema.index({ 'apiKeys.key': 1 }, { sparse: true });

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.twoFactorSecret;
  return obj;
};

export const User = mongoose.model('User', userSchema);
