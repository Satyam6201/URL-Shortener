import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
      index: true,
    },
    shortCode: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipHash: {
      type: String,
      default: 'anonymous',
    },
    country: {
      type: String,
      default: 'Unknown',
      index: true,
    },
    city: {
      type: String,
      default: 'Unknown',
      index: true,
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'bot', 'other'],
      default: 'desktop',
      index: true,
    },
    browser: {
      type: String,
      default: 'Unknown',
      index: true,
    },
    os: {
      type: String,
      default: 'Unknown',
      index: true,
    },
    referrer: {
      type: String,
      default: 'Direct',
      index: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true,
    },
    utmSource: {
      type: String,
      default: null,
      index: true,
    },
    utmMedium: {
      type: String,
      default: null,
    },
    utmCampaign: {
      type: String,
      default: null,
    },
    variantUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

clickSchema.index({ shortCode: 1, timestamp: -1 });
clickSchema.index({ urlId: 1, timestamp: -1 });
clickSchema.index({ shortCode: 1, isBot: 1, timestamp: -1 });

export const Click = mongoose.model('Click', clickSchema);
