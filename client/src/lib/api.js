import axios from 'axios';
import { showToast } from '../utils/toast';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

const raw = axios.create({ baseURL, withCredentials: true });

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Silently reject network errors — individual pages/mutations handle their own feedback
    if (!err.response) {
      return Promise.reject(err);
    }

    // Handle specific error codes
    const status = err.response?.status;
    const message = err.response?.data?.error || err.response?.data?.message;

    // Don't show toast for auth endpoints (handled by auth pages)
    const isAuthEndpoint = original?.url?.includes('/auth/');

    const method = original?.method?.toLowerCase();
    const isBackgroundGet = status === 403 && method === 'get';

    if (!isAuthEndpoint) {
      switch (status) {
        case 400:
          showToast.warning(message || 'Invalid request');
          break;
        case 403:
          if (!isBackgroundGet) {
            showToast.error('You don\'t have permission to perform this action');
          }
          break;
        case 404:
          // Suppress 404 toasts — many background queries probe endpoints that may not exist
          break;
        case 429:
          showToast.warning('Too many requests. Please slow down.');
          break;
        case 500:
        case 502:
        case 503:
          showToast.error('Server error. Please try again later.');
          break;
      }
    }

    // Handle 401 (token refresh)
    if (!original || original._retry) return Promise.reject(err);
    if (status !== 401) return Promise.reject(err);
    if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/login')) {
      return Promise.reject(err);
    }

    original._retry = true;
    try {
      const { data } = await raw.post('/auth/refresh');
      const next = data?.data?.accessToken;
      if (next) {
        setAccessToken(next);
        original.headers.Authorization = `Bearer ${next}`;
        return api(original);
      }
    } catch {
      setAccessToken(null);
      // Only alert the user about session expiry if they previously had an active session
      if (localStorage.getItem('hasSession')) {
        localStorage.removeItem('hasSession');
        showToast.error('Session expired. Please login again.');
      }
    }
    return Promise.reject(err);
  }
);
