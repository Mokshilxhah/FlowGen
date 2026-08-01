import { z } from 'zod';

export const orgRegisterSchema = z.object({
  orgName: z.string().min(1),
  domain: z.string().min(2).max(40),
  industry: z.string().optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().refine(val => !val || /^\d{10}$/.test(val), { message: 'Phone number must be 10 digits' }).optional(),
  taxId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshBodySchema = z.object({}).optional();

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  timezone: z.string().optional(),
  avatar: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  personalEmail: z.string().email().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const preferencesSchema = z.object({
  theme: z.enum(['dark', 'dusk', 'light']).optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      slack: z.boolean().optional(),
    })
    .optional(),
});

export const memberCreateSchema = z.object({
  role: z.enum(['hr', 'employee', 'intern']),
  name: z.string().min(1).optional(),
  personalEmail: z.string().email(),
  phone: z.string().refine(val => !val || /^\d{10}$/.test(val), { message: 'Phone number must be 10 digits' }).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  joinDate: z.coerce.date().optional(),
  managerId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
});

export const memberUpdateSchema = memberCreateSchema.partial().extend({
  status: z.enum(['active', 'invited', 'suspended', 'deactivated']).optional(),
  role: z.enum(['hr', 'employee', 'intern']).optional(),
  companyEmail: z.string().email().optional(),
  password: z.string().min(8).optional(),
  resendCredentials: z.boolean().optional(),
});

export const projectCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  assignedHrId: z.string(),
  teamIds: z.array(z.string()).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  techStack: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const taskCreateSchema = z.object({
  projectId: z.string(),
  teamId: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional(),
  assigneeId: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  tags: z.array(z.string()).optional(),
  storyPoints: z.number().optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.number().optional(),
  position: z.number().optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const messageCreateSchema = z.object({
  toId: z.string(),
  subject: z.string().min(1),
  body: z.string().optional(),
  category: z.enum(['general', 'alert', 'system', 'meeting_invite']).optional(),
});

export const meetingCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  agenda: z.string().optional(),
  participantIds: z.array(z.string()),
  scheduledAt: z.coerce.date(),
  duration: z.number().min(5).max(480).optional(),
  platform: z.enum(['internal', 'zoom', 'teams', 'meet']).optional(),
  meetingLink: z.string().optional(),
});

export const alertCreateSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  recipients: z.object({
    type: z.enum(['all', 'team', 'individual']),
    teamIds: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
  }),
  scheduledAt: z.coerce.date().optional().nullable(),
});
