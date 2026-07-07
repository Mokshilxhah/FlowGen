import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import { getPagination, paginatedResponse } from '../utils/paginate.js';
import { AppError } from '../utils/AppError.js';

export async function listNotifications(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { orgId: req.orgId, userId: req.user._id };
  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);
  res.json({ data: paginatedResponse(items.map((n) => n.toJSON()), total, page, limit) });
}

export async function markRead(req, res) {
  const n = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
  if (!n) throw new AppError('Not found', 404);
  n.isRead = true;
  n.readAt = new Date();
  await n.save();
  res.json({ data: n.toJSON() });
}

export async function markAllRead(req, res) {
  await Notification.updateMany(
    { userId: req.user._id, orgId: req.orgId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.json({ data: { ok: true } });
}

export async function deleteNotification(req, res) {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!n) throw new AppError('Not found', 404);
  res.json({ data: { ok: true } });
}

export async function deleteAll(req, res) {
  await Notification.deleteMany({ userId: req.user._id, orgId: req.orgId });
  res.json({ data: { ok: true } });
}

export async function unreadCount(req, res) {
  const counts = await Notification.aggregate([
    { $match: { userId: req.user._id, orgId: req.orgId, isRead: false } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  
  const breakdown = {
    tasks: 0,
    chat: 0,
    messages: 0,
    meetings: 0,
    learning: 0,
    alerts: 0,
  };
  
  counts.forEach((c) => {
    if (c._id === 'task_assigned' || c._id === 'task_updated') {
      breakdown.tasks += c.count;
    } else if (c._id === 'message') {
      breakdown.messages += c.count;
    } else if (c._id === 'meeting') {
      breakdown.meetings += c.count;
    } else if (c._id === 'alert') {
      breakdown.alerts += c.count;
    } else if (c._id === 'chat') {
      breakdown.chat += c.count;
    } else if (c._id === 'learning') {
      breakdown.learning += c.count;
    }
  });

  // Query actual unread Message count from the Message model
  breakdown.messages = await Message.countDocuments({
    orgId: req.orgId,
    toId: req.user._id,
    isRead: false,
    deletedAt: null,
  });

  res.json({ data: breakdown });
}
