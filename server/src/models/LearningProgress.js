import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: String,
    provider: String,
    skillTags: [String],
    totalHours: Number,
    completedHours: Number,
    completionPercent: Number,
    status: String,
    startedAt: Date,
    completedAt: Date,
  },
  { _id: false }
);

const skillSchema = new mongoose.Schema(
  {
    name: String,
    proficiency: { type: Number, min: 1, max: 5 },
    endorsedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false }
);

const learningProgressSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    internId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    courses: [courseSchema],
    skills: [skillSchema],
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
    },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

learningProgressSchema.plugin(tenantPlugin);

learningProgressSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.orgId = ret.orgId?.toString();
    ret.internId = ret.internId?.toString();
    if (ret.mentorId) ret.mentorId = ret.mentorId.toString();
    return ret;
  },
});

export default mongoose.model('LearningProgress', learningProgressSchema);
