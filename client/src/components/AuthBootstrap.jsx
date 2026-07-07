import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { connectSocket, socket } from '../lib/socket';
import { getAccessToken } from '../lib/api';

export default function AuthBootstrap({ children }) {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (user) {
      const token = getAccessToken();
      connectSocket(token);
    } else {
      socket.disconnect();
    }
  }, [user]);

  return children;
}


