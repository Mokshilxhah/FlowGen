import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    recipients: {
      type: { type: String, enum: ['all', 'team', 'individual'], default: 'individual' },
      teamIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
      userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    scheduledAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    status: { type: String, enum: ['draft', 'sent', 'scheduled', 'failed'], default: 'draft' },
    deliveryStats: {
      sent: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

alertSchema.plugin(tenantPlugin);

alertSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.orgId = ret.orgId?.toString();
    ret.createdBy = ret.createdBy?.toString();
    return ret;
  },
});

export default mongoose.model('Alert', alertSchema);
