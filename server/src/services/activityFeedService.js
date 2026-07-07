import Activity from '../models/Activity.js';
import { getIO } from '../config/socket.js';

export async function logActivity(orgId, { type, message, userId, color = 'accent-electric', metadata = {} }) {
  const doc = await Activity.create({ orgId, type, message, userId, color, metadata });
  try {
    const io = getIO();
    io.to(`org:${orgId.toString()}`).emit('activity:new', { activity: doc.toJSON() });
  } catch {
    /* */
  }
  return doc;
}
