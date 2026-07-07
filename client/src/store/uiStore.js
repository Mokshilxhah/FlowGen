import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      aiChatOpen: false,
      theme: 'dark',
      recentSearches: [],

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () => set(state => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      toggleAIChat: () => set(state => ({ aiChatOpen: !state.aiChatOpen })),
      closeAIChat: () => set({ aiChatOpen: false }),

      setTheme: (theme) => set({ theme }),

      addRecentSearch: (query) => {
        set(state => ({
          recentSearches: [query, ...state.recentSearches.filter(s => s !== query)].slice(0, 5),
        }));
      },
    }),
    {
      name: 'flowgen-ui',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, theme: state.theme, recentSearches: state.recentSearches }),
    }
  )
);
