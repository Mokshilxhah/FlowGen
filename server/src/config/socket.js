import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';

let io;

export const initSocket = (httpServer) => {
  const devOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
  const configuredOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const allowedOrigins = [...configuredOrigins, ...devOrigins];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(cleanOrigin) || /^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(cleanOrigin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(payload.userId);
      if (!user || user.status !== 'active') return next(new Error('Unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const u = socket.user;
    socket.join(`org:${u.orgId.toString()}`);
    socket.join(`user:${u._id.toString()}`);
    if (u.teamId) socket.join(`team:${u.teamId.toString()}`);
    if (u.role === 'hr') socket.join(`hr:${u.orgId.toString()}`);

    socket.on('join:room', async (roomId, cb) => {
      try {
        const room = await ChatRoom.findOne({ _id: roomId, orgId: u.orgId });
        if (!room || !room.participants.some((p) => p.toString() === u._id.toString())) {
          return cb?.({ error: 'Forbidden' });
        }
        socket.join(`chatRoom:${roomId}`);
        cb?.({ success: true });
      } catch (e) {
        cb?.({ error: 'Invalid room' });
      }
    });

    socket.on('chat:send', async (payload, cb) => {
      try {
        const { roomId, content, type, replyToId } = payload || {};
        const room = await ChatRoom.findOne({ _id: roomId, orgId: u.orgId });
        if (!room || !room.participants.some((p) => p.toString() === u._id.toString())) {
          return cb?.({ error: 'Forbidden' });
        }
        const msg = await ChatMessage.create({
          roomId,
          senderId: u._id,
          content: content || '',
          type: type || 'text',
          replyToId: replyToId || null,
        });
        room.lastMessage = (content || '').slice(0, 200);
        room.lastMessageAt = new Date();
        await room.save();
        const json = msg.toJSON();
        io.to(`chatRoom:${roomId}`).emit('chat:message', { message: json });
        cb?.({ message: json });
      } catch (e) {
        cb?.({ error: e.message });
      }
    });

    socket.on('chat:typing:start', ({ roomId }) => {
      socket.to(`chatRoom:${roomId}`).emit('chat:typing', {
        userId: u._id.toString(),
        userName: u.name,
        isTyping: true,
        roomId,
      });
    });

    socket.on('chat:typing:stop', ({ roomId }) => {
      socket.to(`chatRoom:${roomId}`).emit('chat:typing', {
        userId: u._id.toString(),
        userName: u.name,
        isTyping: false,
        roomId,
      });
    });

    socket.on('chat:read', ({ roomId, messageIds }) => {
      socket.to(`chatRoom:${roomId}`).emit('chat:read', {
        userId: u._id.toString(),
        messageIds,
        roomId,
      });
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
