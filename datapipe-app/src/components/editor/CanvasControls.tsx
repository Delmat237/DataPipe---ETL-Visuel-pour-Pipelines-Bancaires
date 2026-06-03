'use client'

import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import {
  ZoomIn, ZoomOut, Maximize2, Play, Loader2, Lock, LockOpen, LayoutGrid,
} from 'lucide-react'
import { useEditorStore } from '@/store/editor.store'
import { useUIStore } from '@/store/ui.store'
import { runsApi } from '@/lib/api/runs'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'

interface CanvasControlsProps {
  pipelineId: string
}

// Un bouton de la barre zoom
function CtrlBtn({
  onClick, children, title,
}: {
  onClick: () => void
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
      style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
    >
      {children}
    </button>
  )
}

export function CanvasControls({ pipelineId }: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { isDemoMode } = useAuthStore()
  const { canvasLocked, toggleCanvasLock } = useUIStore()

  const {
    nodes, edges, runStatus,
    activeRunId, setActiveRun, setRunStatus,
    appendLog, resetRun, setNodes,
  } = useEditorStore()

  // Réorganise les nœuds en colonnes selon la profondeur (gauche → droite)
  const handleTidy = useCallback(() => {
    const ids = nodes.map((n) => n.id)
    const adj: Record<string, string[]> = {}
    const indeg: Record<string, number> = {}
    ids.forEach((id) => { adj[id] = []; indeg[id] = 0 })
    edges.forEach((e) => { if (adj[e.source]) { adj[e.source].push(e.target); indeg[e.target] = (indeg[e.target] ?? 0) + 1 } })

    const depth: Record<string, number> = {}
    const q = ids.filter((id) => indeg[id] === 0)
    q.forEach((id) => { depth[id] = 0 })
    let i = 0, guard = 0
    while (i < q.length && guard < ids.length * 8) {
      guard++
      const id = q[i++]
      for (const t of adj[id] ?? []) {
        const nd = (depth[id] ?? 0) + 1
        if (nd > (depth[t] ?? -1)) { depth[t] = nd; q.push(t) }
      }
    }

    const rowOf: Record<number, number> = {}
    const GAPX = 180, GAPY = 110
    const next = nodes.map((n) => {
      const d = depth[n.id] ?? 0
      const row = (rowOf[d] = (rowOf[d] ?? 0))
      rowOf[d]++
      return { ...n, position: { x: 60 + d * GAPX, y: 80 + row * GAPY } }
    })
    setNodes(next)
    setTimeout(() => fitView({ duration: 350, padding: 0.3 }), 60)
    toast.success('Pipeline réorganisé')
  }, [nodes, edges, setNodes, fitView])

  const handleRun = useCallback(async () => {
    if (isDemoMode) {
      toast.info('Mode démo — connectez une API pour exécuter')
      return
    }
    try {
      const run = await runsApi.run(pipelineId)
      setActiveRun(run.id)
      setRunStatus('running')

      // Stream SSE des logs ; à la fin, on récupère le statut final du run.
      runsApi.streamLogs(
        run.id,
        (log) => appendLog(log),
        async () => {
          try {
            const final = await runsApi.get(pipelineId, run.id)
            setRunStatus(final.status)
            toast[final.status === 'success' ? 'success' : 'error'](
              final.status === 'success' ? 'Run terminé' : 'Run terminé avec erreurs',
            )
          } catch { /* ignore */ }
        },
      )
    } catch {
      toast.error("Erreur lors de l'exécution")
      setRunStatus('failed')
    }
  }, [pipelineId, isDemoMode, setActiveRun, setRunStatus, appendLog])

  const handleCancel = useCallback(async () => {
    if (!activeRunId) return
    try {
      await runsApi.cancel(pipelineId, activeRunId)
      setRunStatus('cancelled')
      resetRun()
      toast.info('Run annulé')
    } catch {
      toast.error("Impossible d'annuler")
    }
  }, [pipelineId, activeRunId, setRunStatus, resetRun])

  const isQueued = runStatus === 'queued' || runStatus === 'running'

  return (
    <div className="flex w-full items-center justify-between pl-7 pr-5 pb-5 pointer-events-none">
      {/* Gauche — contrôles canvas (décalés de la sidebar) */}
      <div className="flex items-center gap-1.5 pointer-events-auto">
        <CtrlBtn onClick={() => fitView({ duration: 250, padding: 0.2 })} title="Ajuster la vue">
          <Maximize2 className="h-3.5 w-3.5" />
        </CtrlBtn>
        <CtrlBtn onClick={() => zoomOut({ duration: 200 })} title="Dézoomer">
          <ZoomOut className="h-3.5 w-3.5" />
        </CtrlBtn>
        <CtrlBtn onClick={() => zoomIn({ duration: 200 })} title="Zoomer">
          <ZoomIn className="h-3.5 w-3.5" />
        </CtrlBtn>
        {/* Réorganiser */}
        <CtrlBtn onClick={handleTidy} title="Réorganiser les nœuds">
          <LayoutGrid className="h-3.5 w-3.5" />
        </CtrlBtn>
        {/* Verrouiller / déverrouiller */}
        <CtrlBtn onClick={toggleCanvasLock} title={canvasLocked ? 'Déverrouiller le canvas' : 'Verrouiller le canvas'}>
          {canvasLocked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
        </CtrlBtn>
      </div>

      {/* Centre — bouton Exécuter */}
      <div className="pointer-events-auto">
        {isQueued ? (
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c41f1f] active:scale-[0.98]"
            style={{ background: '#dc2626' }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Arrêter
          </button>
        ) : (
          <button
            onClick={handleRun}
            className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110 active:scale-[0.98]"
            style={{ background: 'var(--primary)' }}
          >
            <Play className="h-4 w-4" fill="currentColor" />
            Exécuter
          </button>
        )}
      </div>

      {/* Droite — espace symétrique */}
      <div className="w-28" />
    </div>
  )
}
