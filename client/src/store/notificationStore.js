import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Notification store with unread counts per feature — persisted in localStorage */
export const useNotificationStore = create(
  persist(
    (set) => ({
      isOpen: false,
      togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
      closePanel: () => set({ isOpen: false }),

      // Unread counts per feature
      unreadCounts: {
        tasks: 0,
        chat: 0,
        messages: 0,
        meetings: 0,
        learning: 0,
        alerts: 0,
      },

      // Update specific feature counts
      setUnreadCount: (feature, count) => {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [feature]: count,
          },
        }));
      },

      incrementUnreadCount: (feature) => {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [feature]: (state.unreadCounts[feature] || 0) + 1,
          },
        }));
      },

      decrementUnreadCount: (feature) => {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [feature]: Math.max(0, (state.unreadCounts[feature] || 0) - 1),
          },
        }));
      },

      resetUnreadCount: (feature) => {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [feature]: 0,
          },
        }));
      },
    }),
    {
      name: 'flowgen-notification-counts', // localStorage key
      partialize: (state) => ({ unreadCounts: state.unreadCounts }), // only persist the counts, not panel open state
    }
  )
);

