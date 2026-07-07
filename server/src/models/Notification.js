import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['task_assigned', 'task_updated', 'message', 'meeting', 'alert', 'system', 'project'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    fromId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.plugin(tenantPlugin);

notificationSchema.index({ userId: 1, createdAt: -1 });

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.orgId = ret.orgId?.toString();
    ret.userId = ret.userId?.toString();
    if (ret.fromId) ret.fromId = ret.fromId.toString();
    return ret;
  },
});

export default mongoose.model('Notification', notificationSchema);
