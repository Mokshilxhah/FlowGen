import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { socket, connectSocket } from '../../lib/socket';
import { useNotificationStore } from '../../store/notificationStore';
import { getAccessToken, api } from '../../lib/api';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';
import AIChatBot from '../chat/AIChatBot';
import { useAuthStore } from '../../store/authStore';
import PlanLockGuard from '../ui/PlanLockGuard';

export default function RootLayout() {
  const queryClient = useQueryClient();
  const incrementUnreadCount = useNotificationStore((state) => state.incrementUnreadCount);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  // Load unread count breakdown
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => (await api.get('/notifications/unread-count')).data.data,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (unreadData) {
      Object.entries(unreadData).forEach(([feature, count]) => {
        setUnreadCount(feature, count);
      });
    }
  }, [unreadData, setUnreadCount]);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      connectSocket(token);
    }

    const onNewNotification = (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      const type = data.notification?.type;
      if (type === 'alert') {
        incrementUnreadCount('alerts');
      } else if (type === 'task_assigned' || type === 'task_updated') {
        incrementUnreadCount('tasks');
      } else if (type === 'message') {
        incrementUnreadCount('messages');
      } else if (type === 'meeting') {
        incrementUnreadCount('meetings');
      } else if (type === 'learning') {
        incrementUnreadCount('learning');
      }

      toast.success(data.notification.title, {
        description: data.notification.message,
        icon: '🔔',
      });
    };

    const onAttendanceUpdate = () => queryClient.invalidateQueries({ queryKey: ['attendance'] });
    const onProjectUpdate = () => queryClient.invalidateQueries({ queryKey: ['projects'] });
    const onMeetingUpdate = () => queryClient.invalidateQueries({ queryKey: ['meetings'] });
    const onTaskUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-activity'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['org', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      incrementUnreadCount('tasks');
    };
    const onActivityUpdate = () => queryClient.invalidateQueries({ queryKey: ['org', 'activity'] });
    const onChatMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages'] });
      incrementUnreadCount('chat');
    };

    socket.on('notification:new', onNewNotification);
    socket.on('attendance:updated', onAttendanceUpdate);
    socket.on('project:progress-updated', onProjectUpdate);
    socket.on('meeting:updated', onMeetingUpdate);
    socket.on('task:updated', onTaskUpdate);
    socket.on('activity:new', onActivityUpdate);
    socket.on('chat:message', onChatMessage);

    return () => {
      socket.off('notification:new', onNewNotification);
      socket.off('attendance:updated', onAttendanceUpdate);
      socket.off('project:progress-updated', onProjectUpdate);
      socket.off('meeting:updated', onMeetingUpdate);
      socket.off('task:updated', onTaskUpdate);
      socket.off('activity:new', onActivityUpdate);
      socket.off('chat:message', onChatMessage);
      socket.disconnect();
    };
  }, [queryClient, incrementUnreadCount]);

  const location = useLocation();
  const { organization } = useAuthStore();
  const isFreePlan = !organization?.plan || organization?.plan === 'free';
  const isHrRoute = location.pathname.startsWith('/hr/');
  const showLockGuard = isFreePlan && isHrRoute;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080B14' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6" style={{ background: 'linear-gradient(180deg, #080B14 0%, #0A0E1A 100%)' }}>
          {showLockGuard ? <PlanLockGuard /> : <Outlet />}
        </main>
      </div>
      <CommandPalette />
      {!isFreePlan && <AIChatBot />}
    </div>
  );
}
