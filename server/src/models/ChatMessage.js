import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    emoji: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
  },
  { _id: false }
);

const readBySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    type: { type: String, enum: ['text', 'file', 'image', 'system'], default: 'text' },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    reactions: [reactionSchema],
    replyToId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage', default: null },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    readBy: [readBySchema],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

chatMessageSchema.index({ roomId: 1, createdAt: -1 });

chatMessageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    ret.roomId = ret.roomId?.toString();
    ret.senderId = ret.senderId?.toString();
    if (ret.replyToId) ret.replyToId = ret.replyToId.toString();
    return ret;
  },
});

export default mongoose.model('ChatMessage', chatMessageSchema);
