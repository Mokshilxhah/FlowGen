import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';
import { TASK_STATUS, PRIORITY } from '../config/constants.js';

const subtaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    reactions: [
      {
        emoji: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const activityLogSchema = new mongoose.Schema(
  {
    action: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(TASK_STATUS), default: TASK_STATUS.TODO, index: true },
    priority: { type: String, enum: Object.values(PRIORITY), default: PRIORITY.MEDIUM },
    tags: [{ type: String }],
    storyPoints: { type: Number, default: 0 },
    dueDate: { type: Date },
    estimatedHours: { type: Number, default: 0 },
    loggedHours: { type: Number, default: 0 },
    subtasks: [subtaskSchema],
    comments: [commentSchema],
    attachments: [attachmentSchema],
    activityLog: [activityLogSchema],
    position: { type: Number, default: 0 },
    sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.plugin(tenantPlugin);

taskSchema.index({ orgId: 1, status: 1, assigneeId: 1 });

taskSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ['orgId', 'projectId', 'teamId', 'assigneeId', 'createdBy', 'sprintId'].forEach((k) => {
      if (ret[k]) ret[k] = ret[k].toString();
    });
    return ret;
  },
});

export default mongoose.model('Task', taskSchema);
