import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Bell, CheckCheck, Trash2, ClipboardList, MessageSquare, AlertTriangle, Settings, FolderKanban } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../lib/api';

const typeConfig = {
  task_assigned: { icon: ClipboardList, color: '#6366F1', bg: 'rgba(99,102,241,0.15)' },
  task_updated:  { icon: ClipboardList, color: '#06B6D4', bg: 'rgba(6,182,212,0.15)' },
  message:       { icon: MessageSquare, color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  meeting:       { icon: Bell,          color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  alert:         { icon: AlertTriangle, color: '#F43F5E', bg: 'rgba(244,63,94,0.15)' },
  system:        { icon: Settings,      color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  project:       { icon: FolderKanban,  color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
};

export default function NotificationPanel() {
  const queryClient = useQueryClient();
  const { isOpen, closePanel } = useNotificationStore();
  const navigate = useNavigate();

  const { data: page } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => (await api.get('/notifications?limit=50')).data.data,
    enabled: isOpen,
  });
  const notifications = page?.items || [];

  const unreadInList = notifications.filter((n) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40" onClick={closePanel} />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 z-50 flex flex-col"
            style={{ background: 'rgba(13,17,23,0.98)', borderLeft: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}>

            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
              <div className="flex items-center gap-2">
                <Bell size={18} style={{ color: '#6366F1' }} />
                <h2 className="font-bold" style={{ color: '#F1F5F9' }}>Notifications</h2>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}>
                  {unreadInList}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => markAllReadMutation.mutate()} title="Mark all read" disabled={markAllReadMutation.isPending}
                  className="p-1.5 rounded-lg transition-all" style={{ color: '#475569' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; e.currentTarget.style.color = '#10B981'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}>
                  <CheckCheck size={16} />
                </button>
                <button onClick={closePanel}
                  className="p-1.5 rounded-lg transition-all" style={{ color: '#475569' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#F1F5F9'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#475569' }}>
                  <Bell size={40} style={{ opacity: 0.2 }} />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div>
                  {notifications.map((n) => {
                    const tc = typeConfig[n.type] || typeConfig.system;
                    const Icon = tc.icon;
                    return (
                      <motion.div key={n.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="p-4 cursor-pointer transition-all group"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: !n.isRead ? 'rgba(99,102,241,0.04)' : 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = !n.isRead ? 'rgba(99,102,241,0.04)' : 'transparent'}>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            className="flex gap-3 flex-1 min-w-0 text-left"
                            onClick={() => {
                              if (!n.isRead) markReadMutation.mutate(n.id);
                              if (n.link) {
                                navigate(n.link);
                                closePanel();
                              }
                            }}
                          >
                            <div className="p-2 rounded-xl flex-shrink-0 mt-0.5" style={{ background: tc.bg }}>
                              <Icon size={14} style={{ color: tc.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold" style={{ color: !n.isRead ? '#F1F5F9' : '#94A3B8' }}>{n.title}</p>
                                {!n.isRead && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: '#6366F1' }} />}
                              </div>
                              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#475569' }}>{n.message}</p>
                              <p className="text-xs mt-1" style={{ color: '#2D3748' }}>
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            title="Remove"
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-start"
                            style={{ color: '#475569' }}
                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(n.id); }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
