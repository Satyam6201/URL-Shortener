import mongoose from 'mongoose';

const webhookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    events: {
      type: [String],
      enum: ['link.clicked', 'link.expired', 'link.limit_reached', 'link.flagged'],
      default: ['link.clicked'],
    },
    secret: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
    lastStatus: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Webhook = mongoose.model('Webhook', webhookSchema);
