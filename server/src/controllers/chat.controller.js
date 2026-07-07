import mongoose from 'mongoose';
import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';
import { AppError } from '../utils/AppError.js';
import { getPagination, paginatedResponse } from '../utils/paginate.js';
import { getIO } from '../config/socket.js';

export async function listRooms(req, res) {
  const rooms = await ChatRoom.find({
    orgId: req.orgId,
    participants: req.user._id,
    isActive: true,
  }).sort({ lastMessageAt: -1 });
  res.json({ data: rooms.map((r) => r.toJSON()) });
}

export async function createRoom(req, res) {
  const b = req.body;
  const raw = [...(b.participantIds || [])];
  if (!raw.map(String).includes(String(req.user._id))) raw.push(req.user._id);
  const room = await ChatRoom.create({
    orgId: req.orgId,
    type: b.type || 'group',
    name: b.name || null,
    participants: raw.map((id) => new mongoose.Types.ObjectId(id)),
    teamId: b.teamId || null,
    createdBy: req.user._id,
  });
  res.status(201).json({ data: room.toJSON() });
}

export async function listRoomMessages(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const room = await ChatRoom.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!room) throw new AppError('Not found', 404);
  if (!room.participants.some((p) => p.toString() === req.user._id.toString())) {
    throw new AppError('Forbidden', 403);
  }
  const filter = { roomId: room._id, deletedAt: null };
  const [items, total] = await Promise.all([
    ChatMessage.find(filter)
      .populate('senderId', 'name avatar companyEmail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ChatMessage.countDocuments(filter),
  ]);
  const mapped = items.reverse().map((m) => {
    const base = m.toJSON();
    const sender = m.senderId && typeof m.senderId === 'object' && m.senderId.toJSON ? m.senderId.toJSON() : null;
    return { ...base, senderUser: sender };
  });
  res.json({
    data: paginatedResponse(mapped, total, page, limit),
  });
}

export async function postRoomMessage(req, res) {
  const room = await ChatRoom.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!room) throw new AppError('Not found', 404);
  if (!room.participants.some((p) => p.toString() === req.user._id.toString())) {
    throw new AppError('Forbidden', 403);
  }
  const content = String(req.body.content || '').trim().slice(0, 10000);
  if (!content) throw new AppError('Message required', 400);

  const msg = await ChatMessage.create({
    roomId: room._id,
    senderId: req.user._id,
    content,
    type: 'text',
  });
  room.lastMessage = content.slice(0, 200);
  room.lastMessageAt = new Date();
  await room.save();

  const populated = await ChatMessage.findById(msg._id).populate('senderId', 'name avatar companyEmail');
  const base = populated.toJSON();
  const sender =
    populated.senderId && typeof populated.senderId === 'object' && populated.senderId.toJSON
      ? populated.senderId.toJSON()
      : null;
      
  const responseData = { ...base, senderUser: sender };
  try { getIO().to(`chatRoom:${room._id}`).emit('chat:message', responseData); } catch {}
  
  res.status(201).json({ data: responseData });
}

export async function archiveRoom(req, res) {
  const room = await ChatRoom.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!room) throw new AppError('Not found', 404);
  room.isActive = false;
  await room.save();
  res.json({ data: { ok: true } });
}

export async function postRoomFileMessage(req, res) {
  const room = await ChatRoom.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!room) throw new AppError('Not found', 404);
  if (!room.participants.some((p) => p.toString() === req.user._id.toString())) {
    throw new AppError('Forbidden', 403);
  }
  if (!req.file) throw new AppError('No file provided', 400);

  const url = `/uploads/${req.file.filename}`;
  const isImage = req.file.mimetype.startsWith('image/');
  
  const msg = await ChatMessage.create({
    roomId: room._id,
    senderId: req.user._id,
    type: isImage ? 'image' : 'file',
    fileUrl: url,
    fileName: req.file.originalname,
    content: ''
  });

  room.lastMessage = `[${isImage ? 'Image' : 'File'}] ${req.file.originalname}`;
  room.lastMessageAt = new Date();
  await room.save();

  const populated = await ChatMessage.findById(msg._id).populate('senderId', 'name avatar companyEmail');
  const base = populated.toJSON();
  const sender =
    populated.senderId && typeof populated.senderId === 'object' && populated.senderId.toJSON
      ? populated.senderId.toJSON()
      : null;
      
  const responseData = { ...base, senderUser: sender };
  try { getIO().to(`chatRoom:${room._id}`).emit('chat:message', responseData); } catch {}
      
  res.status(201).json({ data: responseData });
}
