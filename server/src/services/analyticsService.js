import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { ROLES, TASK_STATUS } from '../config/constants.js';

const CHART_COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#14B8A6', '#F97316'];

export async function orgDashboardStats(orgId) {
  const [hr, employees, interns, orgAdmins, projects, pendingInvites, totalActiveAccounts] = await Promise.all([
    User.countDocuments({ orgId, role: ROLES.HR, status: 'active' }),
    User.countDocuments({ orgId, role: ROLES.EMPLOYEE, status: 'active' }),
    User.countDocuments({ orgId, role: ROLES.INTERN, status: 'active' }),
    User.countDocuments({ orgId, role: ROLES.ORG_ADMIN, status: 'active' }),
    Project.countDocuments({ orgId, archived: false }),
    User.countDocuments({ orgId, status: 'invited' }),
    User.countDocuments({
      orgId,
      status: { $in: ['active', 'invited', 'suspended'] },
    }),
  ]);

  const activeProjects = await Project.countDocuments({
    orgId,
    archived: false,
    status: { $in: ['active', 'planning'] },
  });

  return {
    members: {
      hr,
      employees,
      interns,
      orgAdmins,
      /** HR + employees + interns (role buckets) */
      total: hr + employees + interns,
      /** Everyone in org with an account (incl. org admins) — use for “total people” */
      totalHeadcount: totalActiveAccounts,
    },
    projects: { total: projects, active: activeProjects },
    pendingInvites,
  };
}

/** Aggregated chart series for org admin + HR dashboards (MongoDB only). */
export async function orgAnalyticsCharts(orgId, hrId = null) {
  const oid = typeof orgId === 'string' ? new mongoose.Types.ObjectId(orgId) : orgId;

  let taskFilter = { orgId: oid, deletedAt: null };
  let projectFilter = { orgId: oid, archived: false };
  let teamFilter = { orgId: oid, isActive: true };

  if (hrId) {
    const hid = typeof hrId === 'string' ? new mongoose.Types.ObjectId(hrId) : hrId;
    projectFilter.assignedHrId = hid;
    teamFilter.createdBy = hid;

    const User = (await import('../models/User.js')).default;
    const TeamModel = (await import('../models/Team.js')).default;
    
    const managedUsers = await User.find({ managerId: hid }).select('_id');
    const managedUserIds = managedUsers.map((u) => u._id);

    const hrTeams = await TeamModel.find({ createdBy: hid, isActive: true }).select('memberIds');
    const hrTeamMemberIds = hrTeams.flatMap((t) => t.memberIds);

    const allManagedUserIds = Array.from(new Set([
      ...managedUserIds.map(id => id.toString()),
      ...hrTeamMemberIds.map(id => id.toString())
    ])).map(id => new mongoose.Types.ObjectId(id));

    taskFilter.assigneeId = { $in: allManagedUserIds };
  }

  const [tasks, projects, teams] = await Promise.all([
    Task.find(taskFilter).lean(),
    Project.find(projectFilter).select('name progress').lean(),
    Team.find(teamFilter).lean(),
  ]);

  const tasksByStatus = Object.values(TASK_STATUS).reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).length;
    return acc;
  }, {});

  const now = new Date();
  const msWeek = 7 * 86400000;
  const weeklyTaskCompletion = [];
  for (let i = 0; i < 8; i++) {
    const start = new Date(now.getTime() - (8 - i) * msWeek);
    const end = new Date(now.getTime() - (7 - i) * msWeek);
    const label = `W${i + 1}`;
    const completed = tasks.filter(
      (t) =>
        t.status === 'done' &&
        t.updatedAt &&
        new Date(t.updatedAt) >= start &&
        new Date(t.updatedAt) <= end
    ).length;
    const assigned = tasks.filter(
      (t) => t.createdAt && new Date(t.createdAt) >= start && new Date(t.createdAt) < end
    ).length;
    weeklyTaskCompletion.push({
      week: label,
      completed,
      assigned: Math.max(assigned, completed),
    });
  }

  const monthlyHours = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthLabel = d.toLocaleString('en', { month: 'short' });
    const hours = tasks
      .filter((t) => t.updatedAt && new Date(t.updatedAt) >= d && new Date(t.updatedAt) < next)
      .reduce((s, t) => s + (Number(t.loggedHours) || 0), 0);
    const target = Math.max(40, Math.round(hours * 1.15) || 40);
    monthlyHours.push({
      month: monthLabel,
      hours: Math.round(hours * 10) / 10,
      target,
    });
  }

  const teamPerformance = teams.slice(0, 12).map((team) => {
    const mids = new Set((team.memberIds || []).map((id) => id.toString()));
    const n = tasks.filter((t) => mids.has(t.assigneeId?.toString())).length;
    return {
      name: team.name,
      tasks: n,
      score: Math.min(100, n * 4 + 15),
    };
  });

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const sprintBurndown = [];
  for (let i = 0; i < 7; i++) {
    const ideal = Math.max(0, Math.round(total - (total * i) / 6));
    const actual = Math.max(0, Math.round(total - (done * i) / 6));
    sprintBurndown.push({ day: `Day ${i + 1}`, ideal, actual });
  }

  const projectProgress = projects.slice(0, 10).map((p, i) => ({
    name: p.name,
    progress: p.progress ?? 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return {
    weeklyTaskCompletion,
    monthlyHours,
    teamPerformance,
    sprintBurndown,
    projectProgress,
    tasksByStatus,
  };
}

export async function recalcProjectProgress(projectId, orgId) {
  const tasks = await Task.find({ projectId, orgId, deletedAt: null });
  if (!tasks.length) {
    await Project.findByIdAndUpdate(projectId, { progress: 0 });
    return 0;
  }
  const done = tasks.filter((t) => t.status === 'done').length;
  const progress = Math.round((done / tasks.length) * 100);
  await Project.findByIdAndUpdate(projectId, { progress });
  return progress;
}
