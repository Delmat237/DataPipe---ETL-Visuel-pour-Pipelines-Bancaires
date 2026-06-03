import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Organisation } from '@/types'
import { authTokens } from '@/lib/api/client'

const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@datapipe.io',
  name: 'Demo User',
  avatar_url: undefined,
  verified: true,
  created_at: new Date().toISOString(),
  orgs: [{ id: 'demo-org', name: 'Demo Org', role: 'admin' }],
}

interface AuthState {
  user: User | null
  currentOrg: Organisation | null
  isAuthenticated: boolean
  isLoading: boolean
  isDemoMode: boolean

  setUser: (user: User) => void
  setCurrentOrg: (org: Organisation) => void
  clearAuth: () => void
  setLoading: (v: boolean) => void
  enableDemoMode: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      currentOrg: null,
      isAuthenticated: false,
      isLoading: true,
      isDemoMode: false,

      setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

      setCurrentOrg: (org) => set({ currentOrg: org }),

      clearAuth: () => {
        authTokens.clear()
        set({ user: null, currentOrg: null, isAuthenticated: false, isLoading: false, isDemoMode: false })
      },

      setLoading: (v) => set({ isLoading: v }),

      enableDemoMode: () => set({
        user: DEMO_USER,
        isAuthenticated: true,
        isLoading: false,
        isDemoMode: true,
      }),
    }),
    {
      name: 'datapipe-auth',
      partialize: (state) => ({
        user: state.user,
        currentOrg: state.currentOrg,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
