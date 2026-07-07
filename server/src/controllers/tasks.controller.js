import crypto from 'crypto';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { recalcProjectProgress } from '../services/analyticsService.js';
import { createNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityFeedService.js';
import { stripHtml } from '../utils/sanitize.js';
import { AppError } from '../utils/AppError.js';
import { getIO } from '../config/socket.js';
import { ROLES } from '../config/constants.js';

function ensureOrgTask(task, orgId) {
  if (!task || task.orgId.toString() !== orgId.toString()) throw new AppError('Not found', 404);
}

function emitTaskSocket(req, event, payload) {
  try {
    const io = getIO();
    io.to(`org:${req.orgId.toString()}`).emit(event, payload);
    if (req.user.teamId) {
      io.to(`team:${req.user.teamId.toString()}`).emit('task:moved', payload);
    }
  } catch {
    /* */
  }
}

export async function listTasks(req, res) {
  const { projectId, assigneeId, status } = req.query;
  const filter = { orgId: req.orgId, deletedAt: null };
  if (projectId) filter.projectId = projectId;
  if (assigneeId) filter.assigneeId = assigneeId;
  if (status) filter.status = status;

  if (req.user.role === ROLES.INTERN) {
    filter.assigneeId = req.user._id;
  } else if (req.user.role === ROLES.EMPLOYEE && !assigneeId) {
    filter.assigneeId = req.user._id;
  } else if (req.user.role === ROLES.HR) {
    const hrProjects = await Project.find({ orgId: req.orgId, assignedHrId: req.user._id }, '_id');
    const hrProjectIds = hrProjects.map(p => p._id.toString());
    
    if (projectId) {
      if (!hrProjectIds.includes(projectId.toString())) {
        filter.projectId = { $in: [] }; // match nothing
      } else {
        filter.projectId = projectId;
      }
    } else {
      filter.projectId = { $in: hrProjects.map(p => p._id) };
    }
  }

  const tasks = await Task.find(filter).sort({ position: 1, updatedAt: -1 });
  res.json({ data: tasks.map((t) => t.toJSON()) });
}

export async function createTask(req, res) {
  const b = req.body;
  const project = await Project.findOne({ _id: b.projectId, orgId: req.orgId });
  if (!project) throw new AppError('Project not found', 404);

  const task = await Task.create({
    orgId: req.orgId,
    projectId: b.projectId,
    teamId: b.teamId || null,
    title: b.title,
    description: stripHtml(b.description || ''),
    assigneeId: b.assigneeId,
    createdBy: req.user._id,
    status: b.status || 'todo',
    priority: b.priority || 'medium',
    tags: b.tags || [],
    storyPoints: b.storyPoints || 0,
    dueDate: b.dueDate,
    estimatedHours: b.estimatedHours || 0,
    position: b.position ?? 0,
  });

  await recalcProjectProgress(project._id, req.orgId);
  
  const assignee = await User.findById(b.assigneeId);
  let link = '/employee/tasks';
  if (assignee) {
    if (assignee.orgId.toString() !== req.orgId.toString()) throw new AppError('Invalid assignee: User does not belong to this organization', 400);
    if (assignee.role === ROLES.INTERN) link = '/intern/tasks';
    else if (assignee.role === ROLES.HR) link = '/hr/dashboard';
    else if (assignee.role === ROLES.ORG_ADMIN) link = '/org/dashboard';
  }

  await createNotification({
    orgId: req.orgId,
    userId: b.assigneeId,
    type: 'task_assigned',
    title: 'New task assigned',
    message: task.title,
    link,
    fromId: req.user._id,
  });

  emitTaskSocket(req, 'task:updated', { taskId: task._id.toString(), changes: task.toJSON() });

  res.status(201).json({ data: task.toJSON() });
}

export async function getTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId, deletedAt: null });
  ensureOrgTask(task, req.orgId);
  res.json({ data: task.toJSON() });
}

export async function updateTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId, deletedAt: null });
  ensureOrgTask(task, req.orgId);
  const b = req.body;
  if (b.title) task.title = b.title;
  if (b.description !== undefined) task.description = stripHtml(b.description);
  if (b.assigneeId) task.assigneeId = b.assigneeId;
  if (b.status) task.status = b.status;
  if (b.priority) task.priority = b.priority;
  if (b.dueDate) task.dueDate = b.dueDate;
  if (b.tags) task.tags = b.tags;
  if (b.storyPoints != null) task.storyPoints = b.storyPoints;
  if (b.estimatedHours != null) task.estimatedHours = b.estimatedHours;
  if (b.loggedHours != null) task.loggedHours = b.loggedHours;
  if (b.position != null) task.position = b.position;
  task.activityLog.push({
    action: 'update',
    userId: req.user._id,
    newValue: b,
    timestamp: new Date(),
  });
  await task.save();
  await recalcProjectProgress(task.projectId, req.orgId);

  emitTaskSocket(req, 'task:updated', { taskId: task._id.toString(), changes: task.toJSON() });

  res.json({ data: task.toJSON() });
}

export async function deleteTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId });
  ensureOrgTask(task, req.orgId);
  task.deletedAt = new Date();
  await task.save();
  await recalcProjectProgress(task.projectId, req.orgId);
  res.json({ data: { ok: true } });
}

export async function patchStatus(req, res) {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId, deletedAt: null });
  ensureOrgTask(task, req.orgId);
  const fromStatus = task.status;
  task.status = req.body.status;
  await task.save();
  await recalcProjectProgress(task.projectId, req.orgId);

  emitTaskSocket(req, 'task:updated', { taskId: task._id.toString(), changes: { status: task.status } });
  emitTaskSocket(req, 'task:moved', {
    taskId: task._id.toString(),
    fromStatus,
    toStatus: task.status,
    movedBy: req.user._id.toString(),
  });

  res.json({ data: task.toJSON() });
}

export async function addComment(req, res) {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId, deletedAt: null });
  ensureOrgTask(task, req.orgId);
  const comment = {
    id: crypto.randomUUID(),
    userId: req.user._id,
    text: stripHtml(req.body.text),
    createdAt: new Date(),
    updatedAt: new Date(),
    reactions: [],
  };
  task.comments.push(comment);
  await task.save();
  res.status(201).json({ data: task.toJSON() });
}

export async function updateComment(req, res) {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId, deletedAt: null });
  ensureOrgTask(task, req.orgId);
  const c = task.comments.find((x) => x.id === req.params.cid);
  if (!c) throw new AppError('Comment not found', 404);
  c.text = stripHtml(req.body.text);
  c.updatedAt = new Date();
  await task.save();
  res.json({ data: task.toJSON() });
}

export async function deleteComment(req, res) {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId, deletedAt: null });
  ensureOrgTask(task, req.orgId);
  task.comments = task.comments.filter((x) => x.id !== req.params.cid);
  await task.save();
  res.json({ data: task.toJSON() });
}

export async function addSubtask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId, deletedAt: null });
  ensureOrgTask(task, req.orgId);
  task.subtasks.push({
    id: crypto.randomUUID(),
    title: req.body.title,
    isCompleted: false,
  });
  await task.save();
  res.json({ data: task.toJSON() });
}

export async function toggleSubtask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId, deletedAt: null });
  ensureOrgTask(task, req.orgId);
  const st = task.subtasks.find((x) => x.id === req.params.sid);
  if (!st) throw new AppError('Subtask not found', 404);
  
  const fromStatus = task.status;
  
  st.isCompleted = !st.isCompleted;
  st.completedBy = st.isCompleted ? req.user._id : null;
  st.completedAt = st.isCompleted ? new Date() : null;

  if (task.subtasks.length > 0) {
    const allDone = task.subtasks.every(s => s.isCompleted);
    if (allDone && task.status !== 'done') {
      task.status = 'done';
    } else if (!allDone && task.status === 'done') {
      task.status = 'in_progress';
    }
  }

  await task.save();
  await recalcProjectProgress(task.projectId, req.orgId);

  if (fromStatus !== task.status) {
    emitTaskSocket(req, 'task:updated', { taskId: task._id.toString(), changes: { status: task.status } });
    emitTaskSocket(req, 'task:moved', {
      taskId: task._id.toString(),
      fromStatus,
      toStatus: task.status,
      movedBy: req.user._id.toString(),
    });
  }

  res.json({ data: task.toJSON() });
}

export async function timeLog(req, res) {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId, deletedAt: null });
  ensureOrgTask(task, req.orgId);
  const { action, hours } = req.body;
  if (action === 'add' && hours) {
    task.loggedHours = (task.loggedHours || 0) + Number(hours);
  }
  await task.save();
  res.json({ data: task.toJSON() });
}

export async function updatePosition(req, res) {
  const task = await Task.findOne({ _id: req.params.id, orgId: req.orgId, deletedAt: null });
  ensureOrgTask(task, req.orgId);
  task.position = req.body.position ?? 0;
  await task.save();
  res.json({ data: task.toJSON() });
}
