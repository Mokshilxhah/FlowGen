import mongoose from 'mongoose';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { ROLES } from '../config/constants.js';

export async function listTeams(req, res) {
  const filter = { orgId: req.orgId, isActive: true };
  if (req.user.role === ROLES.EMPLOYEE || req.user.role === ROLES.INTERN) {
    filter.memberIds = req.user._id;
  } else if (req.user.role === ROLES.HR) {
    filter.createdBy = req.user._id;
  }
  const teams = await Team.find(filter);
  res.json({ data: teams.map((t) => t.toJSON()) });
}

export async function createTeam(req, res) {
  const b = req.body;
  const ids = new Set(b.memberIds || []);
  if (b.leaderId) ids.add(b.leaderId);

  const team = await Team.create({
    orgId: req.orgId,
    name: b.name,
    type: b.type || 'other',
    leaderId: b.leaderId || null,
    memberIds: Array.from(ids).map((id) => new mongoose.Types.ObjectId(id)),
    projectIds: (b.projectIds || []).map((id) => new mongoose.Types.ObjectId(id)),
    createdBy: req.user._id,
  });

  // Sync User.teamId for members of the new team
  await User.updateMany(
    { _id: { $in: team.memberIds }, orgId: req.orgId },
    { $set: { teamId: team._id } }
  );

  res.status(201).json({ data: team.toJSON() });
}

export async function getTeam(req, res) {
  const team = await Team.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!team) throw new AppError('Not found', 404);
  const members = await User.find({ _id: { $in: team.memberIds }, orgId: req.orgId });
  res.json({ data: { team: team.toJSON(), members: members.map((m) => m.toJSON()) } });
}

export async function updateTeam(req, res) {
  const team = await Team.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!team) throw new AppError('Not found', 404);
  const b = req.body;

  const oldMemberIds = (team.memberIds || []).map((id) => id.toString());

  if (b.name) team.name = b.name;
  if (b.type) team.type = b.type;
  if (b.leaderId) team.leaderId = b.leaderId;
  if (b.memberIds) {
    const ids = new Set(b.memberIds);
    if (team.leaderId) ids.add(team.leaderId.toString());
    team.memberIds = Array.from(ids).map((id) => new mongoose.Types.ObjectId(id));
  }
  if (b.projectIds) team.projectIds = b.projectIds.map((id) => new mongoose.Types.ObjectId(id));
  await team.save();

  const newMemberIds = team.memberIds.map((id) => id.toString());
  const removedMemberIds = oldMemberIds.filter((id) => !newMemberIds.includes(id));

  if (removedMemberIds.length > 0) {
    await User.updateMany(
      { _id: { $in: removedMemberIds }, orgId: req.orgId, teamId: team._id },
      { $set: { teamId: null } }
    );
  }

  await User.updateMany(
    { _id: { $in: team.memberIds }, orgId: req.orgId },
    { $set: { teamId: team._id } }
  );

  res.json({ data: team.toJSON() });
}

export async function deleteTeam(req, res) {
  const team = await Team.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!team) throw new AppError('Not found', 404);
  team.isActive = false;
  await team.save();

  // Clear teamId for all members of this team
  await User.updateMany(
    { teamId: team._id, orgId: req.orgId },
    { $set: { teamId: null } }
  );

  res.json({ data: { ok: true } });
}

export async function teamReport(req, res) {
  const team = await Team.findOne({ _id: req.params.id, orgId: req.orgId });
  if (!team) throw new AppError('Not found', 404);
  res.json({
    data: {
      teamId: team.id,
      memberCount: team.memberIds.length,
      projectCount: team.projectIds.length,
    },
  });
}
