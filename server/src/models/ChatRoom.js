import { tenantPlugin } from './plugins/tenantPlugin.js';
import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: { type: String, enum: ['direct', 'group', 'team_channel'], required: true },
    name: { type: String, default: null },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

chatRoomSchema.plugin(tenantPlugin);

chatRoomSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.orgId = ret.orgId?.toString();
    ret.createdBy = ret.createdBy?.toString();
    if (ret.teamId) ret.teamId = ret.teamId.toString();
    ret.participants = (ret.participants || []).map((id) => id.toString());
    return ret;
  },
});

export default mongoose.model('ChatRoom', chatRoomSchema);
