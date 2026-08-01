import { NavLink, useNavigate } from 'react-router-dom';
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

export default function SidebarNav() {
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
    <aside className="w-56 flex-shrink-0 h-screen sticky top-0 bg-[#F5F2EB] border-r border-[#E2DDD3] shadow-md flex flex-col justify-between z-30 select-none text-slate-800">
      {/* Brand & Nav List */}
      <div className="flex flex-col min-h-0 overflow-y-auto">
        {/* Compact Logo Header */}
        <div className="h-14 px-4 border-b border-[#E2DDD3] flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <FlowGenLogo size={26} />
          <span className="font-bold text-slate-900 font-display text-base tracking-tight">FlowGen</span>
        </div>

        {/* Compact Vertical Navigation List */}
        <nav className="p-2.5 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-900/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <item.icon size={16} className={isActive ? 'text-white' : 'text-slate-600'} />
                    <span className="truncate">{item.label}</span>
                  </div>
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
      </div>

      {/* User Profile & Logout Bottom Panel */}
      <div className="p-3 border-t border-[#E2DDD3] space-y-2 bg-[#ECE7DC]/60">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-white/80 border border-[#E2DDD3] shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => { await logout(); navigate('/'); }}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
