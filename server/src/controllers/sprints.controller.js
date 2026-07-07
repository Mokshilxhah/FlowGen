import Sprint from '../models/Sprint.js';
import Task from '../models/Task.js';
import { AppError } from '../utils/AppError.js';

export async function listSprints(req, res) {
  const { projectId } = req.query;
  const filter = { orgId: req.orgId };
  if (projectId) filter.projectId = projectId;
  const items = await Sprint.find(filter).sort({ startDate: -1 });
  res.json({ data: items.map((s) => s.toJSON()) });
}

export async function createSprint(req, res) {
  const b = req.body;
  const s = await Sprint.create({
    orgId: req.orgId,
    projectId: b.projectId,
    teamId: b.teamId || null,
    name: b.name,
    goal: b.goal || '',
    startDate: b.startDate,
    endDate: b.endDate,
    createdBy: req.user._id,
  });
  res.status(201).json({ data: s.toJSON() });
}

export async function updateSprint(req, res) {
  const s = await Sprint.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!s) throw new AppError('Not found', 404);
  Object.assign(s, req.body);
  await s.save();
  res.json({ data: s.toJSON() });
}

export async function completeSprint(req, res) {
  const s = await Sprint.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!s) throw new AppError('Not found', 404);
  s.status = 'completed';
  await s.save();
  res.json({ data: s.toJSON() });
}

export async function burndown(req, res) {
  const sprint = await Sprint.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!sprint) throw new AppError('Not found', 404);
  const tasks = await Task.find({ orgId: req.orgId, sprintId: sprint._id, deletedAt: null });
  const done = tasks.filter((t) => t.status === 'done').length;
  const points = tasks.reduce((a, t) => a + (t.storyPoints || 0), 0);
  res.json({
    data: {
      ideal: [points, 0],
      actual: [points, points - done * 2],
      labels: ['start', 'end'],
    },
  });
}
