import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { ROLES } from '../config/constants.js';
import { logActivity } from '../services/activityFeedService.js';
import { createNotification } from '../services/notificationService.js';
import { AppError } from '../utils/AppError.js';
import User from '../models/User.js';

import { getIO } from '../config/socket.js';

export async function listProjects(req, res) {
  const { role, _id, teamId, orgId } = req.user;
  let q;
  if (role === ROLES.ORG_ADMIN) {
    q = { orgId, archived: false };
  } else if (role === ROLES.HR) {
    q = { orgId, assignedHrId: _id, archived: false };
  } else {
    const taskProjectIds = await Task.distinct('projectId', {
      orgId,
      assigneeId: _id,
      deletedAt: null,
    });
    const or = [];
    if (teamId) or.push({ teamIds: teamId });
    if (taskProjectIds.length) {
      or.push({ _id: { $in: taskProjectIds.map((id) => new mongoose.Types.ObjectId(id)) } });
    }
    q = { orgId, archived: false, $or: or.length ? or : [{ _id: null }] };
  }
  const projects = await Project.find(q).sort({ updatedAt: -1 });
  res.json({ data: projects.map((p) => p.toJSON()) });
}

export async function createProject(req, res) {
  const body = req.body;
  const milestones = (body.milestones || []).map((m, i) => ({
    id: m.id || `m-${Date.now()}-${i}`,
    title: m.title,
    dueDate: m.dueDate,
    status: m.status || 'pending',
  }));

  if (body.assignedHrId) {
    const hr = await User.findOne({ _id: body.assignedHrId, orgId: req.orgId, role: ROLES.HR, status: { $ne: 'deactivated' } });
    if (!hr) throw new AppError('Invalid or deactivated HR assigned', 400);
  }

  const project = await Project.create({
    orgId: req.orgId,
    name: body.name,
    description: body.description || '',
    assignedHrId: body.assignedHrId,
    teamIds: (body.teamIds || []).map((id) => new mongoose.Types.ObjectId(id)),
    status: body.status || 'planning',
    priority: body.priority || 'medium',
    startDate: body.startDate,
    deadline: body.deadline,
    techStack: body.techStack || [],
    tags: body.tags || [],
    milestones,
    createdBy: req.user._id,
  });

  await logActivity(req.orgId, {
    type: 'project_created',
    message: `Project "${project.name}" created`,
    userId: req.user._id,
    color: 'accent-cyan',
  });

  await createNotification({
    orgId: req.orgId,
    userId: project.assignedHrId,
    type: 'project',
    title: 'New project assigned',
    message: project.name,
    link: `/hr/projects/${project._id}`,
    fromId: req.user._id,
  });

  res.status(201).json({ data: project.toJSON() });
}

export async function getProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!project) throw new AppError('Not found', 404);
  
  if (req.user.role === ROLES.HR && project.assignedHrId.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }
  
  res.json({ data: project.toJSON() });
}

export async function updateProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!project) throw new AppError('Not found', 404);
  if (req.user.role === ROLES.HR && project.assignedHrId.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }
  if (req.user.role === ROLES.EMPLOYEE || req.user.role === ROLES.INTERN) {
    throw new AppError('Forbidden', 403);
  }
  const b = req.body;
  if (b.name) project.name = b.name;
  if (b.description !== undefined) project.description = b.description;
  if (b.assignedHrId) {
    const hr = await User.findOne({ _id: b.assignedHrId, orgId: req.orgId, role: ROLES.HR, status: { $ne: 'deactivated' } });
    if (!hr) throw new AppError('Invalid or deactivated HR assigned', 400);
    project.assignedHrId = b.assignedHrId;
  }
  if (b.teamIds) project.teamIds = b.teamIds.map((id) => new mongoose.Types.ObjectId(id));
  if (b.status) project.status = b.status;
  if (b.priority) project.priority = b.priority;
  if (b.startDate !== undefined) project.startDate = b.startDate || null;
  if (b.deadline !== undefined) project.deadline = b.deadline || null;
  if (b.techStack) project.techStack = b.techStack;
  if (b.tags) project.tags = b.tags;
  await project.save();

  try {
    const io = getIO();
    io.to(`org:${req.orgId.toString()}`).emit('project:progress-updated', {
      projectId: project._id.toString(),
      progress: project.progress,
    });
  } catch {
    /* */
  }

  res.json({ data: project.toJSON() });
}

export async function deleteProject(req, res) {
  const project = await Project.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!project) throw new AppError('Not found', 404);
  if (req.user.role === ROLES.HR && project.assignedHrId.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }
  project.archived = true;
  await project.save();
  res.json({ data: { ok: true } });
}

export async function projectStats(req, res) {
  const project = await Project.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!project) throw new AppError('Not found', 404);
  if (req.user.role === ROLES.HR && project.assignedHrId.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }
  const tasks = await Task.find({ projectId: project._id, orgId: req.orgId, deletedAt: null });
  const byStatus = {};
  tasks.forEach((t) => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  });
  res.json({
    data: {
      progress: project.progress,
      taskCount: tasks.length,
      byStatus,
      milestones: project.milestones,
    },
  });
}

export async function addMilestone(req, res) {
  const project = await Project.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!project) throw new AppError('Not found', 404);
  if (req.user.role === ROLES.HR && project.assignedHrId.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }
  const m = req.body;
  project.milestones.push({
    id: m.id || `m-${Date.now()}`,
    title: m.title,
    dueDate: m.dueDate,
    status: m.status || 'pending',
  });
  await project.save();
  res.json({ data: project.toJSON() });
}

export async function updateMilestone(req, res) {
  const project = await Project.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!project) throw new AppError('Not found', 404);
  if (req.user.role === ROLES.HR && project.assignedHrId.toString() !== req.user._id.toString()) {
    throw new AppError('Forbidden', 403);
  }
  const mid = req.params.mid;
  const ms = project.milestones.find((x) => x.id === mid);
  if (!ms) throw new AppError('Milestone not found', 404);
  Object.assign(ms, req.body);
  await project.save();
  res.json({ data: project.toJSON() });
}
