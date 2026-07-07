import Message from '../models/Message.js';
import { AppError } from '../utils/AppError.js';
import { getPagination, paginatedResponse } from '../utils/paginate.js';
import { stripHtml } from '../utils/sanitize.js';

export async function listMessages(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { category } = req.query;
  const filter = { orgId: req.orgId, toId: req.user._id, deletedAt: null };
  if (category) filter.category = category;
  const [rows, total] = await Promise.all([
    Message.find(filter)
      .populate('fromId', 'name avatar companyEmail role designation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments(filter),
  ]);
  const items = rows.map((m) => {
    const base = m.toJSON();
    const from = m.fromId && typeof m.fromId === 'object' && m.fromId.toJSON ? m.fromId.toJSON() : null;
    return { ...base, fromUser: from };
  });
  res.json({ data: paginatedResponse(items, total, page, limit) });
}

export async function sendMessage(req, res) {
  const b = req.body;
  const msg = await Message.create({
    orgId: req.orgId,
    fromId: req.user._id,
    toId: b.toId,
    subject: b.subject,
    body: stripHtml(b.body || ''),
    category: b.category || 'general',
  });
  res.status(201).json({ data: msg.toJSON() });
}

export async function getMessage(req, res) {
  const msg = await Message.findOne({ _id: req.params.id, orgId: req.orgId }).populate(
    'fromId',
    'name avatar companyEmail role designation'
  );
  if (!msg) throw new AppError('Not found', 404);
  if (msg.toId.toString() !== req.user._id.toString() && msg.fromId.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }
  if (!msg.isRead && msg.toId.toString() === req.user._id.toString()) {
    msg.isRead = true;
    msg.readAt = new Date();
    await msg.save();

    try {
      const Notification = (await import('../models/Notification.js')).default;
      const type = msg.category === 'meeting_invite' ? 'meeting' : msg.category;
      if (['alert', 'meeting'].includes(type)) {
        await Notification.updateMany(
          { userId: req.user._id, orgId: req.orgId, isRead: false, type },
          { isRead: true, readAt: new Date() }
        );
      }
    } catch {
      /* ignore */
    }
  }
  const base = msg.toJSON();
  const from = msg.fromId && typeof msg.fromId === 'object' && msg.fromId.toJSON ? msg.fromId.toJSON() : null;
  res.json({ data: { ...base, fromUser: from } });
}

export async function deleteMessage(req, res) {
  const msg = await Message.findOne({ _id: req.params.id, orgId: req.orgId, toId: req.user._id });
  if (!msg) throw new AppError('Not found', 404);
  msg.deletedAt = new Date();
  await msg.save();
  res.json({ data: { ok: true } });
}

export async function starMessage(req, res) {
  const msg = await Message.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!msg) throw new AppError('Not found', 404);
  msg.isStarred = !msg.isStarred;
  await msg.save();
  res.json({ data: msg.toJSON() });
}

export async function unreadCount(req, res) {
  const cats = ['general', 'alert', 'system', 'meeting_invite'];
  const out = {};
  await Promise.all(
    cats.map(async (c) => {
      out[c] = await Message.countDocuments({
        orgId: req.orgId,
        toId: req.user._id,
        category: c,
        isRead: false,
        deletedAt: null,
      });
    })
  );
  res.json({ data: out });
}
