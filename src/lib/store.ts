import { create } from 'zustand'

interface AppState {
  // Theme
  theme: 'dark' | 'light'
  toggleTheme: () => void
  setTheme: (theme: 'dark' | 'light') => void

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  // Active entity IDs (for navigation context)
  activeResumeId: string | null
  setActiveResumeId: (id: string | null) => void
  activeCompanyId: string | null
  setActiveCompanyId: (id: string | null) => void

  // Refresh trigger — increment to force re-fetches
  refreshKey: number
  triggerRefresh: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Theme — default to dark, read from localStorage
  theme: (typeof window !== 'undefined' && localStorage.getItem('resumegit-theme') as 'dark' | 'light') || 'dark',
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('resumegit-theme', next)
      return { theme: next }
    }),
  setTheme: (theme) => {
    localStorage.setItem('resumegit-theme', theme)
    set({ theme })
  },

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // Active entities
  activeResumeId: null,
  setActiveResumeId: (id) => set({ activeResumeId: id }),
  activeCompanyId: null,
  setActiveCompanyId: (id) => set({ activeCompanyId: id }),

  // Refresh
  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}))
