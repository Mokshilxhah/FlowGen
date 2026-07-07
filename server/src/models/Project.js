import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';
import { PROJECT_STATUS, PRIORITY } from '../config/constants.js';

const milestoneSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    dueDate: { type: Date },
    completedAt: { type: Date, default: null },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  },
  { _id: false }
);


const projectSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assignedHrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    status: { type: String, enum: Object.values(PROJECT_STATUS), default: PROJECT_STATUS.PLANNING },
    priority: { type: String, enum: Object.values(PRIORITY), default: PRIORITY.MEDIUM },
    startDate: { type: Date },
    deadline: { type: Date },
    completedAt: { type: Date, default: null },
    techStack: [{ type: String }],
    tags: [{ type: String }],
    progress: { type: Number, min: 0, max: 100, default: 0 },
    milestones: [milestoneSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectSchema.plugin(tenantPlugin);

projectSchema.index({ orgId: 1, assignedHrId: 1 });
projectSchema.index({ orgId: 1, status: 1 });

projectSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ['orgId', 'assignedHrId', 'createdBy'].forEach((k) => {
      if (ret[k]) ret[k] = ret[k].toString();
    });
    if (ret.teamIds?.length) ret.teamIds = ret.teamIds.map((id) => id.toString());
    return ret;
  },
});

export default mongoose.model('Project', projectSchema);
