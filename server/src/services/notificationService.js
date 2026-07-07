import Notification from '../models/Notification.js';
import { getIO } from '../config/socket.js';

export async function createNotification({
  orgId,
  userId,
  type,
  title,
  message,
  link = '',
  fromId = null,
  metadata = {},
}) {
  const n = await Notification.create({
    orgId,
    userId,
    type,
    title,
    message,
    link,
    fromId,
    metadata,
  });
  try {
    const io = getIO();
    io.to(`user:${userId.toString()}`).emit('notification:new', { notification: n.toJSON() });
  } catch {
    /* socket not ready in tests */
  }
  return n;
}

export async function notifyMany(userIds, payload) {
  const docs = [];
  for (const userId of userIds) {
    docs.push(
      await createNotification({
        ...payload,
        userId,
      })
    );
  }
  return docs;
}
