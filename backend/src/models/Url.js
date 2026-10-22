import mongoose from 'mongoose';

const geoTargetSchema = new mongoose.Schema(
  {
    country: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const abVariantSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    weight: { type: Number, default: 50 },
    clicks: { type: Number, default: 0 },
  },
  { _id: false }
);

const urlSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customAlias: {
      type: String,
      default: null,
      sparse: true,
      trim: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      enum: ['General', 'Technology', 'Shopping', 'News', 'Social Media', 'Education', 'Finance', 'Entertainment', 'Other'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    folder: {
      type: String,
      default: 'Default',
      trim: true,
      index: true,
    },
    customDomain: {
      type: String,
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    isOneTime: {
      type: Boolean,
      default: false,
    },
    clickLimit: {
      type: Number,
      default: null,
    },
    clicksCount: {
      type: Number,
      default: 0,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    activateAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    showPreview: {
      type: Boolean,
      default: false,
    },
    deviceTargeting: {
      iosUrl: { type: String, default: null },
      androidUrl: { type: String, default: null },
      desktopUrl: { type: String, default: null },
    },
    geoTargeting: {
      type: [geoTargetSchema],
      default: [],
    },
    utm: {
      source: { type: String, default: null },
      medium: { type: String, default: null },
      campaign: { type: String, default: null },
      term: { type: String, default: null },
      content: { type: String, default: null },
    },
    abTest: {
      isEnabled: { type: Boolean, default: false },
      variants: { type: [abVariantSchema], default: [] },
    },
    aiSafety: {
      isSafe: { type: Boolean, default: true },
      riskScore: { type: Number, default: 0 },
      riskCategory: { type: String, default: 'clean' },
      reasons: { type: [String], default: [] },
      analyzedAt: { type: Date, default: Date.now },
    },
    qrCodeData: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

urlSchema.index({ userId: 1, createdAt: -1 });
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
urlSchema.index({ folder: 1, userId: 1 });

urlSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.hasPassword = !!obj.passwordHash;
  delete obj.passwordHash;
  return obj;
};

export const Url = mongoose.model('Url', urlSchema);
