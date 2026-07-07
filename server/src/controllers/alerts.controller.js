import mongoose from 'mongoose';
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { sendAlertEmail } from '../services/emailService.js';
import { AppError } from '../utils/AppError.js';
import Message from '../models/Message.js';

async function resolveRecipients(orgId, rec) {
  if (rec.type === 'all') {
    return User.find({ orgId, status: 'active' }).select('_id personalEmail companyEmail name');
  }
  if (rec.type === 'team' && rec.teamIds?.length) {
    const Team = (await import('../models/Team.js')).default;
    const teams = await Team.find({ _id: { $in: rec.teamIds }, orgId });
    const ids = new Set();
    teams.forEach((t) => t.memberIds.forEach((id) => ids.add(id.toString())));
    return User.find({ _id: { $in: [...ids] } });
  }
  if (rec.type === 'individual' && rec.userIds?.length) {
    return User.find({ _id: { $in: rec.userIds }, orgId });
  }
  return [];
}

export async function listAlerts(req, res) {
  const alerts = await Alert.find({ orgId: req.orgId, createdBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ data: alerts.map((a) => a.toJSON()) });
}

export async function createAlert(req, res) {
  const b = req.body;
  const alert = await Alert.create({
    orgId: req.orgId,
    createdBy: req.user._id,
    title: b.title,
    message: b.message,
    priority: b.priority || 'medium',
    recipients: {
      type: b.recipients.type,
      teamIds: (b.recipients.teamIds || []).map((id) => new mongoose.Types.ObjectId(id)),
      userIds: (b.recipients.userIds || []).map((id) => new mongoose.Types.ObjectId(id)),
    },
    scheduledAt: b.scheduledAt || null,
    status: b.scheduledAt ? 'scheduled' : 'sent',
    sentAt: b.scheduledAt ? null : new Date(),
  });

  if (!b.scheduledAt) {
    const users = await resolveRecipients(req.orgId, alert.recipients);
    for (const u of users) {
      await createNotification({
        orgId: req.orgId,
        userId: u._id,
        type: 'alert',
        title: alert.title,
        message: alert.message,
        link: '/hr/alerts',
        fromId: req.user._id,
      });
      await Message.create({
        orgId: req.orgId,
        fromId: req.user._id,
        toId: u._id,
        subject: alert.title,
        body: alert.message,
        category: 'alert',
      });
      await sendAlertEmail(u, alert, req.user.name);
    }
    alert.deliveryStats.sent = users.length;
    await alert.save();
  }

  res.status(201).json({ data: alert.toJSON() });
}

export async function updateAlert(req, res) {
  const a = await Alert.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!a) throw new AppError('Not found', 404);
  if (a.status !== 'draft') throw new AppError('Only drafts editable', 400);
  Object.assign(a, req.body);
  await a.save();
  res.json({ data: a.toJSON() });
}

export async function deleteAlert(req, res) {
  const a = await Alert.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!a) throw new AppError('Not found', 404);
  if (a.status !== 'draft') throw new AppError('Only drafts deletable', 400);
  await a.deleteOne();
  res.json({ data: { ok: true } });
}
