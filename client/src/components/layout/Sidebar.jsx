import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, FolderKanban, BarChart3, CreditCard, Settings,
  LogOut, ChevronLeft, ChevronRight, MessageSquare, Calendar, Bell,
  ClipboardList, UserCheck, FileText, Video, BookOpen, GraduationCap,
  Inbox,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import NotificationBubble from '../ui/NotificationBubble';
import { useNotificationStore } from '../../store/notificationStore';
import FlowGenLogo from '../ui/FlowGenLogo';

const navByRole = {
  org_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/org/dashboard', color: '#6366F1' },
    { label: 'Employees', icon: Users, path: '/org/members', color: '#06B6D4' },
    { label: 'Projects', icon: FolderKanban, path: '/org/projects', color: '#8B5CF6' },
    { label: 'Analytics', icon: BarChart3, path: '/org/analytics', color: '#10B981' },
    { label: 'Billing', icon: CreditCard, path: '/org/billing', color: '#F59E0B' },
    { label: 'Inbox', icon: Inbox, path: '/org/inbox', color: '#06B6D4' },
    { label: 'Chat', icon: MessageSquare, path: '/org/chat', color: '#10B981' },
    { label: 'Settings', icon: Settings, path: '/org/settings', color: '#94A3B8' },
  ],
  hr: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/hr/dashboard', color: '#6366F1' },
    { label: 'My Teams', icon: Users, path: '/hr/teams', color: '#06B6D4' },
    { label: 'Projects', icon: FolderKanban, path: '/hr/projects', color: '#8B5CF6' },
    { label: 'Attendance', icon: UserCheck, path: '/hr/attendance', color: '#10B981' },
    { label: 'Reports', icon: FileText, path: '/hr/reports', color: '#8B5CF6' },
    { label: 'Calendar', icon: Calendar, path: '/hr/calendar', color: '#F59E0B' },
    { label: 'Meetings', icon: Video, path: '/hr/meetings', color: '#06B6D4' },
    { label: 'Alerts', icon: Bell, path: '/hr/alerts', color: '#F43F5E' },
    { label: 'Inbox', icon: Inbox, path: '/hr/inbox', color: '#06B6D4' },
    { label: 'Chat', icon: MessageSquare, path: '/hr/chat', color: '#10B981' },
  ],
  employee: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/employee/dashboard', color: '#6366F1' },
    { label: 'My Tasks', icon: ClipboardList, path: '/employee/tasks', color: '#06B6D4' },
    { label: 'Inbox', icon: Inbox, path: '/employee/inbox', color: '#06B6D4' },
    { label: 'Chat', icon: MessageSquare, path: '/employee/chat', color: '#10B981' },
    { label: 'Calendar', icon: Calendar, path: '/employee/calendar', color: '#8B5CF6' },
  ],
  intern: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/intern/dashboard', color: '#6366F1' },
    { label: 'My Tasks', icon: ClipboardList, path: '/intern/tasks', color: '#06B6D4' },
    { label: 'Inbox', icon: Inbox, path: '/intern/inbox', color: '#06B6D4' },
    { label: 'Chat', icon: MessageSquare, path: '/intern/chat', color: '#8B5CF6' },
  ],
};

const roleLabels = {
  org_admin: 'Organization',
  hr: 'HR Portal',
  employee: 'Employee',
  intern: 'Intern',
};

const roleBadgeColors = {
  org_admin: { bg: 'rgba(99,102,241,0.2)', color: '#6366F1' },
  hr: { bg: 'rgba(139,92,246,0.2)', color: '#8B5CF6' },
  employee: { bg: 'rgba(6,182,212,0.2)', color: '#06B6D4' },
  intern: { bg: 'rgba(16,185,129,0.2)', color: '#10B981' },
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { unreadCounts } = useNotificationStore();
  const navigate = useNavigate();
  const navItems = navByRole[user?.role] || [];
  const badge = roleBadgeColors[user?.role] || roleBadgeColors.employee;

  // Map notification counts to nav items
  const getNotificationCount = (path) => {
    if (path.includes('/tasks')) return unreadCounts.tasks || 0;
    if (path.includes('/chat')) return unreadCounts.chat || 0;
    if (path.includes('/inbox')) return unreadCounts.messages || 0;
    if (path.includes('/meetings')) return unreadCounts.meetings || 0;
    if (path.includes('/alerts')) return unreadCounts.alerts || 0;
    return 0;
  };

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 248 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen flex-shrink-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0A0E1A 0%, #080B14 100%)', borderRight: '1px solid rgba(99,102,241,0.12)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
        <FlowGenLogo size={36} />
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <span className="font-bold text-white font-display text-lg">FlowGen</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => (
          <motion.div key={item.path} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
            <NavLink to={item.path}>
              {({ isActive }) => (
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${sidebarCollapsed ? 'justify-center' : ''}`}
                  style={{
                    background: isActive ? `linear-gradient(90deg, ${item.color}25, ${item.color}08)` : 'transparent',
                    borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all relative"
                    style={{
                      background: isActive ? `${item.color}25` : 'rgba(255,255,255,0.05)',
                      color: isActive ? item.color : '#94A3B8',
                    }}>
                    <item.icon size={16} />
                    <NotificationBubble 
                      count={getNotificationCount(item.path)} 
                      color="#EF4444"
                      size="xs"
                    />
                  </div>
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                        style={{ color: isActive ? '#F1F5F9' : '#94A3B8' }}>
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#F1F5F9' }}>{user?.name}</p>
            </div>
          </div>
        )}
        <button onClick={async () => { await logout(); navigate('/'); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm"
          style={{ color: '#475569' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#F43F5E'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}>
          <LogOut size={16} />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all"
        style={{ background: '#1A2236', border: '1px solid rgba(99,102,241,0.3)', color: '#94A3B8' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = '#94A3B8'; }}>
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
