import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { socket, connectSocket } from '../../lib/socket';
import { useNotificationStore } from '../../store/notificationStore';
import { getAccessToken, api } from '../../lib/api';
import SidebarNav from './SidebarNav';
import CommandPalette from './CommandPalette';
import AIChatBot from '../chat/AIChatBot';

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
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a] text-slate-100 relative">
      {/* Soft Ambient Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-30 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      <SidebarNav />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto p-6 bg-transparent">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
      <AIChatBot />
    </div>
  );
}
