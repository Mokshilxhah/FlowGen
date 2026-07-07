import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';
import { ROLES, USER_STATUS } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    personalEmail: { type: String, lowercase: true, trim: true, sparse: true },
    companyEmail: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), required: true, index: true },
    avatar: { type: String, default: null },
    phone: { type: String, default: null },
    department: { type: String, default: null },
    designation: { type: String, default: null },
    joinDate: { type: Date, default: Date.now },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    isTeamLeader: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE },
    inviteToken: { type: String, default: null, select: false },
    inviteTokenExpiry: { type: Date, default: null },
    refreshTokenHash: { type: String, default: null, select: false },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null },
    lastLogin: { type: Date, default: null },
    bio: { type: String, default: '' },
    timezone: { type: String, default: 'UTC' },
    preferences: {
      theme: { type: String, enum: ['dark', 'dusk', 'light'], default: 'dark' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        slack: { type: Boolean, default: false },
      },
    },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.plugin(tenantPlugin);

userSchema.index({ orgId: 1, companyEmail: 1 }, { unique: true });
userSchema.index({ personalEmail: 1, orgId: 1 }, { sparse: true });

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.refreshTokenHash;
    delete ret.inviteToken;
    delete ret.passwordResetToken;
    delete ret.twoFactorSecret;
    if (ret.orgId) ret.orgId = ret.orgId.toString();
    if (ret.managerId) ret.managerId = ret.managerId.toString();
    if (ret.teamId) ret.teamId = ret.teamId.toString();
    return ret;
  },
});

export default mongoose.model('User', userSchema);
