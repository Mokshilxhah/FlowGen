import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, AuthRedirect } from '../utils/roleGuard';
import RootLayout from '../components/layout/RootLayout';
import PlanLockGuard from '../components/ui/PlanLockGuard';

import LandingPage from '../pages/landing/LandingPage';
import OrgLogin from '../pages/auth/OrgLogin';
import HRLogin from '../pages/auth/HRLogin';
import EmployeeLogin from '../pages/auth/EmployeeLogin';
import InternLogin from '../pages/auth/InternLogin';
import ForgotPassword from '../pages/auth/ForgotPassword';

import OrgDashboard from '../pages/org/OrgDashboard';
import MembersPage from '../pages/org/MembersPage';
import ProjectsPage from '../pages/org/ProjectsPage';
import BillingPage from '../pages/org/BillingPage';
import OrgSettings from '../pages/org/OrgSettings';
import AnalyticsPage from '../pages/org/AnalyticsPage';

import HRDashboard from '../pages/hr/HRDashboard';
import TeamsPage from '../pages/hr/TeamsPage';
import AttendancePage from '../pages/hr/AttendancePage';
import ReportsPage from '../pages/hr/ReportsPage';
import CalendarPage from '../pages/hr/CalendarPage';
import MeetingsPage from '../pages/hr/MeetingsPage';
import AlertsPage from '../pages/hr/AlertsPage';

import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import TasksPage from '../pages/employee/TasksPage';
import InboxPage from '../pages/employee/InboxPage';
import ChatPage from '../pages/employee/ChatPage';
import EmployeeCalendarPage from '../pages/employee/CalendarPage';

import InternDashboard from '../pages/intern/InternDashboard';
import InternTasksPage from '../pages/intern/TasksPage';

import SharedSettings from '../pages/shared/SettingsPage';
import NotFound from '../pages/shared/NotFound';
import AIAssistantPage from '../pages/shared/AIAssistantPage';



export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/org/login', element: <AuthRedirect><OrgLogin /></AuthRedirect> },
  { path: '/hr/login', element: <AuthRedirect><HRLogin /></AuthRedirect> },
  { path: '/team/login', element: <AuthRedirect><EmployeeLogin /></AuthRedirect> },
  { path: '/intern/login', element: <AuthRedirect><InternLogin /></AuthRedirect> },
  
  // Legacy Redirects
  { path: '/auth/org', element: <Navigate to="/org/login" replace /> },
  { path: '/auth/member', element: <Navigate to="/team/login" replace /> },
  { path: '/auth/forgot-password', element: <ForgotPassword /> },

  {
    element: <ProtectedRoute allowedRoles={['org_admin']}><RootLayout /></ProtectedRoute>,
    children: [
      { path: '/org/dashboard', element: <OrgDashboard /> },
      { path: '/org/members', element: <MembersPage /> },
      { path: '/org/projects', element: <ProjectsPage /> },
      { path: '/org/analytics', element: <PlanLockGuard><AnalyticsPage /></PlanLockGuard> },
      { path: '/org/billing', element: <BillingPage /> },
      { path: '/org/settings', element: <OrgSettings /> },
      { path: '/org/chat', element: <ChatPage /> },
      { path: '/org/inbox', element: <InboxPage /> },
      { path: '/org/ai-chat', element: <PlanLockGuard><AIAssistantPage /></PlanLockGuard> },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['hr']}><RootLayout /></ProtectedRoute>,
    children: [
      { path: '/hr/dashboard', element: <HRDashboard /> },
      { path: '/hr/teams', element: <TeamsPage /> },
      { path: '/hr/projects', element: <ProjectsPage /> },
      { path: '/hr/attendance', element: <AttendancePage /> },
      { path: '/hr/reports', element: <PlanLockGuard><ReportsPage /></PlanLockGuard> },
      { path: '/hr/calendar', element: <CalendarPage /> },
      { path: '/hr/meetings', element: <MeetingsPage /> },
      { path: '/hr/alerts', element: <AlertsPage /> },
      { path: '/hr/chat', element: <ChatPage /> },
      { path: '/hr/inbox', element: <InboxPage /> },
      { path: '/hr/settings', element: <SharedSettings /> },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['employee']}><RootLayout /></ProtectedRoute>,
    children: [
      { path: '/employee/dashboard', element: <EmployeeDashboard /> },
      { path: '/employee/tasks', element: <TasksPage /> },
      { path: '/employee/inbox', element: <InboxPage /> },
      { path: '/employee/chat', element: <ChatPage /> },
      { path: '/employee/calendar', element: <EmployeeCalendarPage /> },
      { path: '/employee/settings', element: <SharedSettings /> },
      { path: '/employee/ai', element: <EmployeeDashboard /> },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['intern']}><RootLayout /></ProtectedRoute>,
    children: [
      { path: '/intern/dashboard', element: <InternDashboard /> },
      { path: '/intern/tasks', element: <InternTasksPage /> },
      { path: '/intern/chat', element: <ChatPage /> },
      { path: '/intern/inbox', element: <InboxPage /> },
      { path: '/intern/settings', element: <SharedSettings /> },
    ],
  },

  { path: '*', element: <NotFound /> },
]);
