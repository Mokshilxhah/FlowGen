import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date, default: null },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'wfh', 'leave'],
      default: 'present',
    },
    hoursWorked: { type: Number, default: 0 },
    note: { type: String, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

attendanceSchema.plugin(tenantPlugin);

attendanceSchema.index({ orgId: 1, userId: 1, date: 1 }, { unique: true });

attendanceSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.orgId = ret.orgId?.toString();
    ret.userId = ret.userId?.toString();
    if (ret.approvedBy) ret.approvedBy = ret.approvedBy.toString();
    return ret;
  },
});

export default mongoose.model('Attendance', attendanceSchema);
