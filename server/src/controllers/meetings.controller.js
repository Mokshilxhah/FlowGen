import mongoose from 'mongoose';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { sendMeetingInviteEmail, sendMeetingCancelledEmail } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';
import { AppError } from '../utils/AppError.js';
import { ROLES } from '../config/constants.js';
import Message from '../models/Message.js';

export async function listMeetings(req, res) {
  const filter = { orgId: req.orgId };
  if (req.user.role === ROLES.HR) {
    filter.$or = [
      { organizerId: req.user._id },
      { participantIds: req.user._id }
    ];
  } else if (req.user.role !== ROLES.ORG_ADMIN) {
    filter.participantIds = req.user._id;
  }
  const meetings = await Meeting.find(filter).sort({ scheduledAt: 1 });
  res.json({ data: meetings.map((m) => m.toJSON()) });
}

export async function createMeeting(req, res) {
  const b = req.body;
  const meeting = await Meeting.create({
    orgId: req.orgId,
    title: b.title,
    description: b.description || '',
    agenda: b.agenda || '',
    organizerId: req.user._id,
    participantIds: (b.participantIds || []).map((id) => new mongoose.Types.ObjectId(id)),
    scheduledAt: b.scheduledAt,
    duration: b.duration || 30,
    platform: b.platform || 'internal',
    meetingLink: b.meetingLink || '',
    status: 'scheduled',
  });

  const org = await Organization.findById(req.orgId);
  const users = await User.find({ _id: { $in: meeting.participantIds } });
  const emails = users.map((u) => u.personalEmail || u.companyEmail).filter(Boolean);
  if (emails.length) {
    await sendMeetingInviteEmail(meeting, org, emails);
  }

  for (const uid of meeting.participantIds) {
    await createNotification({
      orgId: req.orgId,
      userId: uid,
      type: 'meeting',
      title: 'New meeting scheduled',
      message: meeting.title,
      link: '/hr/meetings',
      fromId: req.user._id,
    });
    await Message.create({
      orgId: req.orgId,
      fromId: req.user._id,
      toId: uid,
      subject: `Meeting Invite: ${meeting.title}`,
      body: `You have been invited to a meeting: ${meeting.title}\n\nScheduled at: ${meeting.scheduledAt}\nPlatform: ${meeting.platform}\nAgenda: ${meeting.agenda}`,
      category: 'meeting_invite',
    });
  }

  try {
    const io = (await import('../config/socket.js')).getIO();
    io.to(`org:${req.orgId.toString()}`).emit('meeting:updated');
  } catch {
    /* */
  }

  res.status(201).json({ data: meeting.toJSON() });
}

export async function getMeeting(req, res) {
  const m = await Meeting.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!m) throw new AppError('Not found', 404);
  res.json({ data: m.toJSON() });
}

export async function updateMeeting(req, res) {
  const m = await Meeting.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!m) throw new AppError('Not found', 404);
  Object.assign(m, req.body);
  await m.save();
  
  try {
    const io = (await import('../config/socket.js')).getIO();
    io.to(`org:${req.orgId.toString()}`).emit('meeting:updated');
  } catch {
    /* */
  }
  
  res.json({ data: m.toJSON() });
}

export async function cancelMeeting(req, res) {
  const m = await Meeting.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!m) throw new AppError('Not found', 404);
  await Meeting.deleteOne({ _id: req.params.id, orgId: req.orgId });
  const org = await Organization.findById(req.orgId);
  const users = await User.find({ _id: { $in: m.participantIds } });
  const emails = users.map((u) => u.personalEmail || u.companyEmail).filter(Boolean);
  if (emails.length) await sendMeetingCancelledEmail(m, org, emails);
  
  try {
    const io = (await import('../config/socket.js')).getIO();
    io.to(`org:${req.orgId.toString()}`).emit('meeting:updated');
  } catch {
    /* */
  }
  
  res.json({ data: { ok: true } });
}

export async function addNotes(req, res) {
  const m = await Meeting.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!m) throw new AppError('Not found', 404);
  m.notes = req.body.notes || '';
  await m.save();
  res.json({ data: m.toJSON() });
}
