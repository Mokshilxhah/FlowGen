import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    name: { type: String, required: true },
    goal: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['planning', 'active', 'completed'], default: 'planning' },
    totalPoints: { type: Number, default: 0 },
    completedPoints: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

sprintSchema.plugin(tenantPlugin);

sprintSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.orgId = ret.orgId?.toString();
    ret.projectId = ret.projectId?.toString();
    if (ret.teamId) ret.teamId = ret.teamId.toString();
    ret.createdBy = ret.createdBy?.toString();
    return ret;
  },
});

export default mongoose.model('Sprint', sprintSchema);
