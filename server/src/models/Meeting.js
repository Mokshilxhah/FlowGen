import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    agenda: { type: String, default: '' },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 30 },
    platform: {
      type: String,
      enum: ['internal', 'zoom', 'teams', 'meet'],
      default: 'internal',
    },
    meetingLink: { type: String, default: '' },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    recurringRule: {
      frequency: String,
      endDate: Date,
    },
    notes: { type: String, default: '' },
    recordingUrl: { type: String, default: null },
  },
  { timestamps: true }
);

meetingSchema.plugin(tenantPlugin);

meetingSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.orgId = ret.orgId?.toString();
    ret.organizerId = ret.organizerId?.toString();
    ret.participantIds = (ret.participantIds || []).map((id) => id.toString());
    return ret;
  },
});

export default mongoose.model('Meeting', meetingSchema);
