import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { orgsApi, type AppOrg } from '@/lib/api/orgs'
import { workspacesApi, type AppWorkspace } from '@/lib/api/workspaces'

interface WorkspaceState {
  orgs: AppOrg[]
  workspaces: AppWorkspace[]
  currentOrgId: string | null
  currentWorkspaceId: string
  loaded: boolean
  init: () => Promise<void>
  selectOrg: (orgId: string) => Promise<void>
  selectWorkspace: (wsId: string) => void
  refreshOrgs: () => Promise<void>
  refreshWorkspaces: () => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      orgs: [],
      workspaces: [],
      currentOrgId: null,
      // 'default' tant que les vrais workspaces ne sont pas chargés (compat backend).
      currentWorkspaceId: 'default',
      loaded: false,

      init: async () => {
        if (get().loaded) return
        try {
          const orgs = await orgsApi.list()
          set({ orgs })
          const orgId = get().currentOrgId ?? orgs[0]?.id ?? null
          if (orgId) {
            set({ currentOrgId: orgId })
            const workspaces = await workspacesApi.list(orgId)
            set({ workspaces })
            const persisted = get().currentWorkspaceId
            const valid = workspaces.some((w) => w.id === persisted)
            set({ currentWorkspaceId: valid ? persisted : (workspaces[0]?.id ?? 'default') })
          }
        } catch {
          /* offline / non connecté : on garde 'default' */
        } finally {
          set({ loaded: true })
        }
      },

      selectOrg: async (orgId) => {
        set({ currentOrgId: orgId })
        try {
          const workspaces = await workspacesApi.list(orgId)
          set({ workspaces, currentWorkspaceId: workspaces[0]?.id ?? 'default' })
        } catch { set({ workspaces: [] }) }
      },

      selectWorkspace: (wsId) => set({ currentWorkspaceId: wsId }),

      refreshOrgs: async () => {
        try { set({ orgs: await orgsApi.list() }) } catch { /* noop */ }
      },

      refreshWorkspaces: async () => {
        const orgId = get().currentOrgId
        if (!orgId) return
        try { set({ workspaces: await workspacesApi.list(orgId) }) } catch { /* noop */ }
      },
    }),
    {
      name: 'datapipe-workspace',
      partialize: (s) => ({ currentOrgId: s.currentOrgId, currentWorkspaceId: s.currentWorkspaceId }),
    },
  ),
)
