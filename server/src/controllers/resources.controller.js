import Resource from '../models/Resource.js';
import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError.js';
import { uploadDirPath } from '../middleware/upload.middleware.js';
import { ROLES } from '../config/constants.js';

export async function listResources(req, res) {
  const { teamId } = req.query;
  const filter = { orgId: req.orgId, isActive: true };
  if (teamId) filter.teamId = teamId;
  const items = await Resource.find(filter).sort({ updatedAt: -1 });
  res.json({ data: items.map((r) => r.toJSON()) });
}

export async function createResource(req, res) {
  if (req.user.role !== ROLES.EMPLOYEE || !req.user.isTeamLeader) {
    if (req.user.role !== ROLES.ORG_ADMIN && req.user.role !== ROLES.HR) {
      throw new AppError('Team leaders or admins only', 403);
    }
  }
  const file = req.file;
  if (!file) throw new AppError('File required', 400);
  const b = req.body;
  const rel = `/uploads/${file.filename}`;
  const doc = await Resource.create({
    orgId: req.orgId,
    teamId: b.teamId,
    uploadedBy: req.user._id,
    title: b.title || file.originalname,
    description: b.description || '',
    category: b.category || 'other',
    fileUrl: rel,
    fileName: file.originalname,
    fileSize: file.size,
    fileType: file.mimetype,
    targetRoles: b.targetRoles ? JSON.parse(b.targetRoles) : ['all'],
    tags: b.tags ? JSON.parse(b.tags) : [],
    notes: b.notes || '',
  });
  res.status(201).json({ data: doc.toJSON() });
}

export async function getResource(req, res) {
  const r = await Resource.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!r) throw new AppError('Not found', 404);
  r.viewCount += 1;
  await r.save();
  res.json({ data: r.toJSON() });
}

export async function updateResource(req, res) {
  const r = await Resource.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!r) throw new AppError('Not found', 404);
  Object.assign(r, req.body);
  await r.save();
  res.json({ data: r.toJSON() });
}

export async function deleteResource(req, res) {
  const r = await Resource.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!r) throw new AppError('Not found', 404);
  r.isActive = false;
  await r.save();
  res.json({ data: { ok: true } });
}

export async function addResourceComment(req, res) {
  const r = await Resource.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!r) throw new AppError('Not found', 404);
  r.comments.push({
    userId: req.user._id,
    text: req.body.text,
    createdAt: new Date(),
  });
  await r.save();
  res.json({ data: r.toJSON() });
}

export async function downloadResource(req, res) {
  const r = await Resource.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!r) throw new AppError('Not found', 404);
  r.downloadCount += 1;
  await r.save();
  const abs = path.join(uploadDirPath, path.basename(r.fileUrl));
  if (!fs.existsSync(abs)) throw new AppError('File missing', 404);
  res.download(abs, r.fileName);
}
