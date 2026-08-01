import LearningProgress from '../models/LearningProgress.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import crypto from 'crypto';

export async function getProgress(req, res) {
  let doc = await LearningProgress.findOne({ internId: req.user._id, orgId: req.orgId });
  if (!doc) {
    doc = await LearningProgress.create({
      orgId: req.orgId,
      internId: req.user._id,
      courses: [],
      skills: [],
      streak: { current: 0, longest: 0, lastActiveDate: null },
    });
  }
  res.json({ data: doc.toJSON() });
}

export async function addCourse(req, res) {
  const { internId, title, provider, totalHours, skillTags } = req.body;
  if (!internId) throw new AppError('Intern ID is required', 400);

  const intern = await User.findOne({ _id: internId, orgId: req.orgId });
  if (!intern) throw new AppError('Intern not found', 404);

  let doc = await LearningProgress.findOne({ internId, orgId: req.orgId });
  if (!doc) {
    doc = await LearningProgress.create({
      orgId: req.orgId,
      internId,
      courses: [],
      skills: [],
      streak: { current: 0, longest: 0, lastActiveDate: null },
    });
  }

  doc.courses.push({
    id: crypto.randomUUID(),
    title,
    provider,
    skillTags: skillTags || [],
    totalHours: totalHours || 0,
    completedHours: 0,
    completionPercent: 0,
    status: 'in_progress',
    startedAt: new Date(),
  });
  await doc.save();
  res.json({ data: doc.toJSON() });
}

export async function updateCourse(req, res) {
  const doc = await LearningProgress.findOne({ internId: req.user._id, orgId: req.orgId });
  if (!doc) throw new AppError('Not found', 404);
  const course = doc.courses.find((x) => x.id === req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  Object.assign(course, req.body);
  await doc.save();
  res.json({ data: doc.toJSON() });
}

export async function getSkills(req, res) {
  const doc = await LearningProgress.findOne({ internId: req.user._id, orgId: req.orgId });
  res.json({ data: { skills: doc?.skills || [] } });
}

export async function updateSkills(req, res) {
  let doc = await LearningProgress.findOne({ internId: req.user._id, orgId: req.orgId });
  if (!doc) doc = await LearningProgress.create({ orgId: req.orgId, internId: req.user._id });
  doc.skills = req.body.skills || [];
  await doc.save();
  res.json({ data: doc.toJSON() });
}

export async function getMentor(req, res) {
  const doc = await LearningProgress.findOne({ internId: req.user._id, orgId: req.orgId });
  const mentorId = doc?.mentorId || req.user.managerId;
  if (!mentorId) return res.json({ data: { mentor: null } });
  const mentor = await User.findById(mentorId);
  res.json({ data: { mentor: mentor?.toJSON() || null } });
}

export async function listAllProgress(req, res) {
  const docs = await LearningProgress.find({ orgId: req.orgId });
  res.json({ data: docs.map((d) => d.toJSON()) });
}

export async function assignMentor(req, res) {
  const { internId, mentorId } = req.body;
  if (!internId) throw new AppError('Intern ID is required', 400);

  const intern = await User.findOne({ _id: internId, orgId: req.orgId });
  if (!intern) throw new AppError('Intern not found', 404);

  if (mentorId) {
    const mentor = await User.findOne({ _id: mentorId, orgId: req.orgId });
    if (!mentor) throw new AppError('Mentor not found', 404);

    if (String(intern.teamId || '') !== String(mentor.teamId || '')) {
      throw new AppError('Mentor must belong to the same team as the intern', 400);
    }
  }

  let doc = await LearningProgress.findOne({ internId, orgId: req.orgId });
  if (!doc) {
    doc = await LearningProgress.create({
      orgId: req.orgId,
      internId,
      courses: [],
      skills: [],
      streak: { current: 0, longest: 0, lastActiveDate: null },
    });
  }

  doc.mentorId = mentorId || null;
  await doc.save();

  res.json({ data: doc.toJSON() });
}
