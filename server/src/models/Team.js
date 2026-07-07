import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['frontend', 'backend', 'design', 'qa', 'devops', 'other'],
      default: 'other',
    },
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    projectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

teamSchema.plugin(tenantPlugin);

teamSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.orgId = ret.orgId?.toString();
    if (ret.leaderId) ret.leaderId = ret.leaderId.toString();
    if (ret.createdBy) ret.createdBy = ret.createdBy.toString();
    ret.memberIds = (ret.memberIds || []).map((id) => id.toString());
    ret.projectIds = (ret.projectIds || []).map((id) => id.toString());
    return ret;
  },
});

export default mongoose.model('Team', teamSchema);
