import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Node drawer (editor)
  nodeDrawerOpen: boolean
  // When set, a newly added node auto-connects from this source node
  pendingSourceNodeId: string | null
  // When set, a newly added node is inserted on this edge
  pendingEdgeId: string | null
  openNodeDrawer: (opts?: { sourceNodeId?: string; edgeId?: string }) => void
  closeNodeDrawer: () => void

  // Canvas verrouillé : empêche le déplacement des nœuds
  canvasLocked: boolean
  toggleCanvasLock: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      nodeDrawerOpen: false,
      pendingSourceNodeId: null,
      pendingEdgeId: null,
      openNodeDrawer: (opts) => set({
        nodeDrawerOpen: true,
        pendingSourceNodeId: opts?.sourceNodeId ?? null,
        pendingEdgeId: opts?.edgeId ?? null,
      }),
      closeNodeDrawer: () => set({ nodeDrawerOpen: false, pendingSourceNodeId: null, pendingEdgeId: null }),

      canvasLocked: false,
      toggleCanvasLock: () => set((s) => ({ canvasLocked: !s.canvasLocked })),
    }),
    {
      name: 'datapipe-ui',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
)
