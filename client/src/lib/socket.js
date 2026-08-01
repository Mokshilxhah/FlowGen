import { io } from 'socket.io-client';

const baseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
const URL = baseUrl.replace('/api/v1', '').replace('/api', '');

export const socket = io(URL, {
  withCredentials: true,
  autoConnect: false,
});

export const connectSocket = (token) => {
  socket.auth = { token };
  socket.connect();
};

