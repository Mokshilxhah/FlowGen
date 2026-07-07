import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';

const resourceCommentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['theme', 'design', 'snippet', 'doc', 'schema', 'workflow', 'other'],
      default: 'other',
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    fileType: { type: String, default: '' },
    targetRoles: [{ type: String, enum: ['employee', 'intern', 'all'] }],
    tags: [{ type: String }],
    notes: { type: String, default: '' },
    downloadCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    comments: [resourceCommentSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

resourceSchema.plugin(tenantPlugin);

resourceSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.orgId = ret.orgId?.toString();
    ret.teamId = ret.teamId?.toString();
    ret.uploadedBy = ret.uploadedBy?.toString();
    return ret;
  },
});

export default mongoose.model('Resource', resourceSchema);
