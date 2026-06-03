import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'datapipe-theme'

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', mode === 'dark')
  try { localStorage.setItem(STORAGE_KEY, mode) } catch { /* ignore */ }
}

interface ThemeState {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
  /** Sync the store from the value already applied by the no-flash script. */
  hydrate: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',
  setTheme: (mode) => { applyTheme(mode); set({ theme: mode }) },
  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },
  hydrate: () => {
    if (typeof window === 'undefined') return
    let stored: ThemeMode = 'dark'
    try { stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'dark' } catch { /* ignore */ }
    set({ theme: stored })
  },
}))
