/** Shared enums and magic strings — multi-tenant FlowGen API */

export const ROLES = {
  ORG_ADMIN: 'org_admin',
  HR: 'hr',
  EMPLOYEE: 'employee',
  INTERN: 'intern',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  INVITED: 'invited',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
};

export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const TASK_STATUS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
};

export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const TEAM_TYPES = ['frontend', 'backend', 'design', 'qa', 'devops', 'other'];

export const PLANS = ['free', 'pro', 'enterprise'];

export const COOKIE_REFRESH = 'refreshToken';
