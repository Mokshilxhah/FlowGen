import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, FolderKanban, BarChart3, CreditCard, Settings,
  LogOut, MessageSquare, Calendar, Bell, ClipboardList, UserCheck, FileText,
  Video, GraduationCap, Inbox,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationBubble from '../ui/NotificationBubble';
import { useNotificationStore } from '../../store/notificationStore';
import FlowGenLogo from '../ui/FlowGenLogo';

const navByRole = {
  org_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/org/dashboard' },
    { label: 'Employees', icon: Users, path: '/org/members' },
    { label: 'Projects', icon: FolderKanban, path: '/org/projects' },
    { label: 'Analytics', icon: BarChart3, path: '/org/analytics' },
    { label: 'Billing', icon: CreditCard, path: '/org/billing' },
    { label: 'Inbox', icon: Inbox, path: '/org/inbox' },
    { label: 'Chat', icon: MessageSquare, path: '/org/chat' },
    { label: 'Settings', icon: Settings, path: '/org/settings' },
  ],
  hr: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/hr/dashboard' },
    { label: 'My Teams', icon: Users, path: '/hr/teams' },
    { label: 'Projects', icon: FolderKanban, path: '/hr/projects' },
    { label: 'Attendance', icon: UserCheck, path: '/hr/attendance' },
    { label: 'Reports', icon: FileText, path: '/hr/reports' },
    { label: 'Calendar', icon: Calendar, path: '/hr/calendar' },
    { label: 'Meetings', icon: Video, path: '/hr/meetings' },
    { label: 'Alerts', icon: Bell, path: '/hr/alerts' },
    { label: 'Inbox', icon: Inbox, path: '/hr/inbox' },
    { label: 'Chat', icon: MessageSquare, path: '/hr/chat' },
  ],
  employee: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/employee/dashboard' },
    { label: 'My Tasks', icon: ClipboardList, path: '/employee/tasks' },
    { label: 'Inbox', icon: Inbox, path: '/employee/inbox' },
    { label: 'Chat', icon: MessageSquare, path: '/employee/chat' },
    { label: 'Calendar', icon: Calendar, path: '/employee/calendar' },
  ],
  intern: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/intern/dashboard' },
    { label: 'My Tasks', icon: ClipboardList, path: '/intern/tasks' },
    { label: 'Inbox', icon: Inbox, path: '/intern/inbox' },
    { label: 'Chat', icon: MessageSquare, path: '/intern/chat' },
  ],
};

export default function HeaderNav() {
  const { user, logout } = useAuthStore();
  const { unreadCounts } = useNotificationStore();
  const navigate = useNavigate();
  const navItems = navByRole[user?.role] || [];

  const getNotificationCount = (path) => {
    if (path.includes('/tasks')) return unreadCounts.tasks || 0;
    if (path.includes('/chat')) return unreadCounts.chat || 0;
    if (path.includes('/inbox')) return unreadCounts.messages || 0;
    if (path.includes('/meetings')) return unreadCounts.meetings || 0;
    if (path.includes('/alerts')) return unreadCounts.alerts || 0;
    return 0;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F172A] border-b border-white/10 shadow-md">
      <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
          <FlowGenLogo size={32} />
          <span className="font-bold text-white font-display text-lg tracking-tight">FlowGen</span>
        </div>

        {/* Horizontal Navigation Options */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all relative ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                  <NotificationBubble
                    count={getNotificationCount(item.path)}
                    color="#EF4444"
                    size="xs"
                  />
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0)}
            </div>
            <span className="text-xs font-medium text-white max-w-[120px] truncate hidden sm:inline-block">
              {user?.name}
            </span>
          </div>

          <button
            type="button"
            onClick={async () => { await logout(); navigate('/'); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
            title="Logout"
          >
            <LogOut size={15} />
            <span className="hidden md:inline-block">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
