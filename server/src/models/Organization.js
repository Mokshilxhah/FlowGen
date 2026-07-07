import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, lowercase: true, trim: true, unique: true },
    industry: { type: String, default: 'Technology' },
    logo: { type: String, default: null },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    billingEmail: { type: String, default: null },
    address: { type: String, default: null },
    city: { type: String, default: null },
    country: { type: String, default: null },
    phone: { type: String, default: null },
    taxId: { type: String, default: null },
    verificationStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'], 
      default: 'pending' 
    },
    membersCount: {
      hr: { type: Number, default: 0 },
      employees: { type: Number, default: 0 },
      interns: { type: Number, default: 0 },
    },
    settings: {
      allowSelfRegistration: { type: Boolean, default: false },
      timezone: { type: String, default: 'UTC' },
      workHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
      },
    },
    subscription: {
      planId: { type: String, default: null },
      status: { type: String, enum: ['active', 'cancelled', 'past_due', 'trialing'], default: 'active' },
      renewsAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

organizationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Organization', organizationSchema);
