import { create } from 'zustand';
import { api, setAccessToken } from '../lib/api';
import { queryClient } from '../lib/queryClient.js';

export const useAuthStore = create((set) => ({
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  lastPortal: localStorage.getItem('last_portal') || '/',

  setLastPortal: (path) => {
    localStorage.setItem('last_portal', path);
    set({ lastPortal: path });
  },

  /** Restore session via httpOnly refresh cookie */
  bootstrap: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/refresh');
      const token = data?.data?.accessToken;
      if (token) {
        setAccessToken(token);
        localStorage.setItem('hasSession', 'true');
        const me = await api.get('/auth/me');
        set({
          user: me.data.data.user,
          organization: me.data.data.organization,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error('No access token received');
      }
    } catch (e) {
      if (!e.response) {
        // Network/server offline error, do not clear session state
        set({ isLoading: false });
        return;
      }
      setAccessToken(null);
      localStorage.removeItem('hasSession');
      set({ user: null, organization: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  login: async (email, password, mode = 'member') => {
    set({ isLoading: true, error: null });
    try {
      const path = mode === 'org' ? '/auth/org/login' : '/auth/member/login';
      console.debug('[auth] POST', path, { email });
      const { data } = await api.post(path, { email, password });
      console.debug('[auth] response', data);
      const token = data?.data?.accessToken;
      if (token) setAccessToken(token);
      
      localStorage.setItem('hasSession', 'true');
      
      set({
        user: data.data.user,
        organization: data.data.organization || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true, role: data.data?.user?.role, user: data.data?.user };
    } catch (e) {
      console.debug('[auth] login error', e.response?.status, e.response?.data || e.message);
      const msg = e.response?.data?.error || 'Invalid credentials';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  requestRegisterOtp: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      console.debug('[auth] POST /auth/org/register-otp', payload);
      await api.post('/auth/org/register-otp', payload);
      set({ isLoading: false, error: null });
      return { success: true };
    } catch (e) {
      let msg = e.response?.data?.error || 'Failed to send verification code';
      if (e.response?.data?.details?.fieldErrors) {
        const errors = e.response.data.details.fieldErrors;
        const firstField = Object.keys(errors)[0];
        if (firstField && errors[firstField][0]) {
          const fieldName = firstField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          msg = `${fieldName}: ${errors[firstField][0]}`;
        }
      }
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  verifyRegisterOtp: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      console.debug('[auth] POST /auth/org/verify-otp', { email, otp });
      const { data } = await api.post('/auth/org/verify-otp', { email, otp });
      console.debug('[auth] verify OTP response', data);
      const token = data?.data?.accessToken;
      if (token) setAccessToken(token);
      
      localStorage.setItem('hasSession', 'true');
      
      set({
        user: data.data.user,
        organization: data.data.organization,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true, role: data.data.user.role };
    } catch (e) {
      const msg = e.response?.data?.error || 'OTP verification failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* */
    }
    setAccessToken(null);
    localStorage.removeItem('hasSession');
    localStorage.removeItem('flowgen_timer_enabled');
    localStorage.removeItem('flowgen_timer_start');
    queryClient.clear();
    set({ user: null, organization: null, isAuthenticated: false, error: null });
  },

  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.patch('/user/profile', updates);
      set((state) => ({ 
        user: { ...state.user, ...data.data },
        isLoading: false 
      }));
      return { success: true };
    } catch (e) {
      const msg = e.response?.data?.error || 'Update failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  updatePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch('/user/password', { currentPassword, newPassword });
      set({ isLoading: false });
      return { success: true };
    } catch (e) {
      const msg = e.response?.data?.error || 'Password update failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  updateOrgProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.patch('/org/profile', updates);
      set((state) => ({ 
        organization: { ...state.organization, ...data.data },
        isLoading: false 
      }));
      return { success: true };
    } catch (e) {
      const msg = e.response?.data?.error || 'Organization update failed';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  updateOrganization: (updates) => {
    set((state) => ({
      organization: state.organization ? { ...state.organization, ...updates } : null
    }));
  },

  updateUser: (updates) => {
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null }));
  },

  clearError: () => set({ error: null }),

  setLoading: (isLoading) => set({ isLoading }),
}));
