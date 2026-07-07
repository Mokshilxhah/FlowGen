import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    fromId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    body: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ['general', 'alert', 'system', 'meeting_invite'],
      default: 'general',
    },
    attachments: [{ type: String }],
    replyToId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    readAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.plugin(tenantPlugin);

messageSchema.index({ orgId: 1, toId: 1, createdAt: -1 });

messageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ['orgId', 'fromId', 'toId', 'replyToId'].forEach((k) => {
      if (ret[k]) ret[k] = ret[k].toString();
    });
    return ret;
  },
});

export default mongoose.model('Message', messageSchema);
