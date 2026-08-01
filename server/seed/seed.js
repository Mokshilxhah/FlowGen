import mongoose from 'mongoose';
import 'dotenv/config';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import Team from '../src/models/Team.js';
import Project from '../src/models/Project.js';
import Task from '../src/models/Task.js';
import Attendance from '../src/models/Attendance.js';
import ChatRoom from '../src/models/ChatRoom.js';
import ChatMessage from '../src/models/ChatMessage.js';
import Activity from '../src/models/Activity.js';
import Message from '../src/models/Message.js';
import Alert from '../src/models/Alert.js';
import Meeting from '../src/models/Meeting.js';
import { hashPassword } from '../src/services/authService.js';
import { ROLES, USER_STATUS, TASK_STATUS, PRIORITY, PROJECT_STATUS } from '../src/config/constants.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/flowgen';

async function main() {
  console.log('Connecting to database at:', uri);
  await mongoose.connect(uri);
  
  console.log('Dropping database to clear all old data...');
  await mongoose.connection.dropDatabase();
  console.log('Database cleared successfully.');

  console.log('Seeding organization, users, teams, projects, tasks, attendance, and chats...');
  
  // 1. Create Organization (TCS)
  const org = await Organization.create({
    name: 'TCS',
    domain: 'tcs',
    industry: 'Technology & Consulting Services',
    plan: 'enterprise',
    address: '100 Innovation Way',
    city: 'Mumbai',
    country: 'India',
    phone: '+91-22-67789999',
    taxId: 'TCS-IN-998877',
    verificationStatus: 'verified',
    membersCount: {
      hr: 1,
      employees: 1,
      interns: 1
    }
  });

  // Hashed passwords following format @#$Name123
  const mokshilPassword = await hashPassword('@#$Mokshil123');
  const dolenPassword = await hashPassword('@#$Dolen123');
  const rahulPassword = await hashPassword('@#$Rahul123');
  const alexPassword = await hashPassword('@#$Alex123');

  // 2. Create Org Admin User - Mokshil
  const admin = await User.create({
    orgId: org._id,
    name: 'Mokshil',
    personalEmail: 'admin@tcs.flowgen.app',
    companyEmail: 'mokshil@tcs.flowgen.app',
    password: mokshilPassword,
    role: ROLES.ORG_ADMIN,
    status: USER_STATUS.ACTIVE,
    department: 'Executive',
    designation: 'Organization Admin',
  });

  // Link Organization to Admin
  org.adminId = admin._id;
  await org.save();

  // 3. Create HR Manager User - Dolen
  const hr = await User.create({
    orgId: org._id,
    name: 'Dolen',
    personalEmail: 'hr@tcs.flowgen.app',
    companyEmail: 'dolen@tcs.flowgen.app',
    password: dolenPassword,
    role: ROLES.HR,
    status: USER_STATUS.ACTIVE,
    department: 'Human Resources',
    designation: 'HR Manager',
  });

  // 4. Create Employee User - Rahul
  const employee = await User.create({
    orgId: org._id,
    name: 'Rahul',
    personalEmail: 'rahul@gmail.com',
    companyEmail: 'rahul@tcs.flowgen.app',
    password: rahulPassword,
    role: ROLES.EMPLOYEE,
    status: USER_STATUS.ACTIVE,
    department: 'Engineering',
    designation: 'Software Engineer',
    managerId: hr._id,
  });

  // 5. Create Intern User - Alex
  const intern = await User.create({
    orgId: org._id,
    name: 'Alex',
    personalEmail: 'intern@tcs.flowgen.app',
    companyEmail: 'alex@tcs.flowgen.app',
    password: alexPassword,
    role: ROLES.INTERN,
    status: USER_STATUS.ACTIVE,
    department: 'Engineering',
    designation: 'Software Engineering Intern',
    managerId: hr._id,
  });

  // 6. Create Team
  const team = await Team.create({
    orgId: org._id,
    name: 'Core Engineering',
    type: 'frontend',
    leaderId: employee._id,
    memberIds: [employee._id, intern._id],
    createdBy: hr._id,
    isActive: true,
  });

  // Update member users to point to the team
  employee.teamId = team._id;
  employee.isTeamLeader = true;
  await employee.save();

  intern.teamId = team._id;
  await intern.save();

  // 7. Create Project
  const project = await Project.create({
    orgId: org._id,
    name: 'Flowgen Core Platform',
    description: 'Next-generation workforce management platform development for TCS',
    assignedHrId: hr._id,
    teamIds: [team._id],
    status: PROJECT_STATUS.ACTIVE,
    priority: PRIORITY.HIGH,
    startDate: new Date(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    progress: 45,
    techStack: ['React', 'Node.js', 'MongoDB'],
    tags: ['Core', 'Platform'],
    createdBy: admin._id,
  });

  team.projectIds = [project._id];
  await team.save();

  // 8. Create Tasks
  await Task.create([
    {
      orgId: org._id,
      projectId: project._id,
      teamId: team._id,
      title: 'Build Authentication & RBAC Modules',
      description: 'Implement JWT authentication & role-based access control for Admin, HR, Employee, and Intern.',
      assigneeId: employee._id,
      createdBy: hr._id,
      status: TASK_STATUS.IN_PROGRESS,
      priority: PRIORITY.HIGH,
      tags: ['Auth', 'Security'],
      storyPoints: 5,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      orgId: org._id,
      projectId: project._id,
      teamId: team._id,
      title: 'Design Dashboard Micro-Interactions',
      description: 'Create smooth CSS animations for employee dashboard cards.',
      assigneeId: intern._id,
      createdBy: employee._id,
      status: TASK_STATUS.TODO,
      priority: PRIORITY.MEDIUM,
      tags: ['Frontend', 'UI'],
      storyPoints: 3,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    }
  ]);

  // 9. Seed Attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await Attendance.create([
    { orgId: org._id, userId: admin._id, date: today, checkIn: new Date(today.getTime() + 9 * 3600000), status: 'present', hoursWorked: 8 },
    { orgId: org._id, userId: hr._id, date: today, checkIn: new Date(today.getTime() + 9 * 3600000 + 15 * 60000), status: 'present', hoursWorked: 8 },
    { orgId: org._id, userId: employee._id, date: today, checkIn: new Date(today.getTime() + 9 * 3600000 + 5 * 60000), status: 'present', hoursWorked: 8 },
    { orgId: org._id, userId: intern._id, date: today, checkIn: new Date(today.getTime() + 9 * 3600000 + 30 * 60000), status: 'present', hoursWorked: 7.5 }
  ]);

  // 10. Seed General Chat Channel
  const chatRoom = await ChatRoom.create({
    orgId: org._id,
    type: 'team_channel',
    name: 'General Discussion',
    participants: [admin._id, hr._id, employee._id, intern._id],
    teamId: team._id,
    lastMessage: 'Welcome to TCS FlowGen workspace!',
    lastMessageAt: new Date(),
    createdBy: admin._id,
  });

  await ChatMessage.create([
    {
      roomId: chatRoom._id,
      senderId: admin._id,
      content: 'Welcome everyone! Glad to have Mokshil, Dolen, Rahul, and Alex on board at TCS!',
      readBy: [{ userId: hr._id }, { userId: employee._id }, { userId: intern._id }]
    },
    {
      roomId: chatRoom._id,
      senderId: hr._id,
      content: 'Thanks Mokshil! Excited to streamline team workflows at TCS.',
      readBy: [{ userId: admin._id }, { userId: employee._id }, { userId: intern._id }]
    }
  ]);

  // 11. Seed Activities
  await Activity.create([
    {
      orgId: org._id,
      type: 'project_created',
      message: 'Project "Flowgen Core Platform" was created',
      userId: admin._id,
      color: 'accent-cyan',
      createdAt: new Date(Date.now() - 3600000 * 2)
    },
    {
      orgId: org._id,
      type: 'member_added',
      message: 'Alex was added to the organization as an Intern',
      userId: hr._id,
      color: 'accent-violet',
      createdAt: new Date(Date.now() - 3600000 * 1.5)
    },
    {
      orgId: org._id,
      type: 'task_assigned',
      message: 'Rahul was assigned the task "Build Authentication & RBAC Modules"',
      userId: hr._id,
      color: 'accent-electric',
      createdAt: new Date(Date.now() - 3600000 * 1)
    },
    {
      orgId: org._id,
      type: 'attendance_checkin',
      message: 'Mokshil checked in today',
      userId: admin._id,
      color: 'accent-emerald',
      createdAt: new Date(Date.now() - 60000 * 30)
    }
  ]);

  // 12. Seed General Mails (Message)
  await Message.create([
    {
      orgId: org._id,
      fromId: admin._id,
      toId: hr._id,
      subject: 'Q3 Strategy Planning',
      body: "Hi Dolen, let's schedule a session to review intern training progress and milestone status for Flowgen Core Platform next week.",
      category: 'general',
      isRead: false,
    },
    {
      orgId: org._id,
      fromId: employee._id,
      toId: hr._id,
      subject: 'Authentication Modules Completed',
      body: 'Hi Dolen, I have completed the primary RBAC security endpoints and requested Mokshil for a deployment window. Let me know if we need to sync.',
      category: 'general',
      isRead: true,
    },
    {
      orgId: org._id,
      fromId: hr._id,
      toId: employee._id,
      subject: 'Intern Mentorship Program Details',
      body: 'Hi Rahul, I have assigned Alex to your team as a Software Engineering Intern. Please make sure to check their course learning and assign mentors accordingly.',
      category: 'general',
      isRead: false,
    }
  ]);

  // 13. Seed Broadcast Alerts
  await Alert.create([
    {
      orgId: org._id,
      title: 'Scheduled Server Maintenance',
      message: 'The local database server will be undergoing maintenance on Sunday between 2:00 AM and 4:00 AM IST. Please save your work.',
      priority: 'high',
      recipients: { type: 'all' },
      status: 'sent',
      sentAt: new Date(Date.now() - 3600000),
      deliveryStats: { sent: 4, read: 2 },
      createdBy: hr._id,
    },
    {
      orgId: org._id,
      title: 'TCS FlowGen Phase 2 Release',
      message: 'All modules for the FlowGen Core Platform are undergoing final testing. High performance marks all around.',
      priority: 'medium',
      recipients: { type: 'all' },
      status: 'sent',
      sentAt: new Date(Date.now() - 7200000),
      deliveryStats: { sent: 4, read: 4 },
      createdBy: hr._id,
    }
  ]);

  // 14. Seed Calendar Meetings
  await Meeting.create([
    {
      orgId: org._id,
      title: 'Sprint Review & Demo',
      agenda: 'Review the authentication flows and frontend interactions.',
      organizerId: hr._id,
      participantIds: [hr._id, employee._id, intern._id],
      scheduledAt: new Date(Date.now() + 24 * 3600000),
      duration: 45,
      platform: 'meet',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'scheduled',
    },
    {
      orgId: org._id,
      title: 'Project Kickoff',
      agenda: 'Align on phase 2 architecture and database schema.',
      organizerId: admin._id,
      participantIds: [admin._id, hr._id, employee._id, intern._id],
      scheduledAt: new Date(Date.now() - 48 * 3600000),
      duration: 60,
      platform: 'zoom',
      status: 'completed',
    }
  ]);

  console.log('\n✅ TCS Mock dummy data seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('1. Org Admin  : Mokshil | mokshil@tcs.flowgen.app | Password: @#$Mokshil123');
  console.log('2. HR Manager : Dolen   | dolen@tcs.flowgen.app   | Password: @#$Dolen123');
  console.log('3. Employee   : Rahul   | rahul@tcs.flowgen.app   | Password: @#$Rahul123');
  console.log('4. Intern     : Alex    | alex@tcs.flowgen.app    | Password: @#$Alex123');
  console.log('----------------------------------------------------\n');

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
