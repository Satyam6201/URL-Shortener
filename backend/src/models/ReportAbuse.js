import mongoose from 'mongoose';

const reportAbuseSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      index: true,
    },
    originalUrl: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      required: true,
      enum: ['malware', 'phishing', 'spam', 'copyright', 'illegal', 'other'],
      default: 'spam',
    },
    description: {
      type: String,
      default: '',
    },
    reporterIp: {
      type: String,
      default: 'Unknown',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'banned', 'dismissed'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ReportAbuse = mongoose.model('ReportAbuse', reportAbuseSchema);
