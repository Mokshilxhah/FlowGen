import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';

/** Org dashboard live activity feed items */
const activitySchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: { type: String, default: 'general' },
    message: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    color: { type: String, default: 'accent-electric' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.plugin(tenantPlugin);

activitySchema.index({ orgId: 1, createdAt: -1 });

activitySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.orgId = ret.orgId?.toString();
    if (ret.userId) ret.userId = ret.userId.toString();
    return ret;
  },
});

export default mongoose.model('Activity', activitySchema);
