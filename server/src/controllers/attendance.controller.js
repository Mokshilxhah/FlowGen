import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';
import { getIO } from '../config/socket.js';

function dayStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function listAttendance(req, res) {
  const { userId, from, to } = req.query;
  const filter = { orgId: req.orgId };
  if (req.user.role === ROLES.HR) {
    const managedUsers = await User.find({ managerId: req.user._id }).select('_id');
    const managedIds = managedUsers.map((u) => u._id);
    if (userId) {
      if (managedIds.some(id => id.toString() === userId.toString())) {
        filter.userId = userId;
      } else {
        filter.userId = null; // not managed
      }
    } else {
      filter.userId = { $in: managedIds };
    }
  } else if (req.user.role === ROLES.EMPLOYEE || req.user.role === ROLES.INTERN) {
    filter.userId = req.user._id;
  } else if (userId) {
    filter.userId = userId;
  }

  if (from && to) {
    filter.date = { $gte: new Date(from), $lte: new Date(to) };
  }
  const rows = await Attendance.find(filter).sort({ date: -1 }).limit(500);
  res.json({ data: rows.map((r) => r.toJSON()) });
}

export async function checkIn(req, res) {
  const targetUserId = req.body.userId || req.user._id;
  const today = dayStart(new Date());
  let row = await Attendance.findOne({
    orgId: req.orgId,
    userId: targetUserId,
    date: today,
  });
  if (!row) {
    row = await Attendance.create({
      orgId: req.orgId,
      userId: targetUserId,
      date: today,
      checkIn: new Date(),
      status: 'present',
    });
  } else {
    row.checkIn = new Date();
    await row.save();
  }
  try {
    const io = getIO();
    io.to(`hr:${req.orgId.toString()}`).emit('attendance:updated', {
      userId: targetUserId.toString(),
      status: row.status,
    });
  } catch {
    /* */
  }
  res.json({ data: row.toJSON() });
}

export async function checkOut(req, res) {
  const row = await Attendance.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!row) throw new AppError('Not found', 404);
  row.checkOut = new Date();
  if (row.checkIn) {
    row.hoursWorked = (row.checkOut - row.checkIn) / 3600000;
  }
  await row.save();
  res.json({ data: row.toJSON() });
}

export async function attendanceReport(req, res) {
  const { userId, month } = req.query;
  const filter = { orgId: req.orgId };
  if (req.user.role === ROLES.HR) {
    const managedUsers = await User.find({ managerId: req.user._id }).select('_id');
    const managedIds = managedUsers.map((u) => u._id);
    if (userId) {
      if (managedIds.some(id => id.toString() === userId.toString())) {
        filter.userId = userId;
      } else {
        filter.userId = null;
      }
    } else {
      filter.userId = { $in: managedIds };
    }
  } else if (req.user.role === ROLES.EMPLOYEE || req.user.role === ROLES.INTERN) {
    filter.userId = req.user._id;
  } else if (userId) {
    filter.userId = userId;
  }

  if (month) {
    const [y, m] = month.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    filter.date = { $gte: start, $lte: end };
  }
  const rows = await Attendance.find(filter);
  res.json({ data: rows.map((r) => r.toJSON()) });
}

export async function patchAttendance(req, res) {
  const row = await Attendance.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!row) throw new AppError('Not found', 404);

  if (req.user.role === ROLES.HR) {
    const attendanceUser = await User.findById(row.userId);
    if (!attendanceUser || attendanceUser.managerId?.toString() !== req.user._id.toString()) {
      throw new AppError('Forbidden: You can only edit attendance for employees you manage', 403);
    }
  }

  Object.assign(row, req.body);
  await row.save();
  res.json({ data: row.toJSON() });
}
