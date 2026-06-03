'use client'

import { useEffect, useRef, useState } from 'react'
import { Ban, RotateCcw, Trash2, Radio } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { runsApi } from '@/lib/api/runs'
import { formatDuration, getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { LogEntry, Run } from '@/types'
import { RunStatusBadge } from './page'

const LEVEL_COLOR: Record<LogEntry['level'], string> = {
  INFO: 'text-gray-400',
  WARNING: 'text-amber-400',
  ERROR: 'text-red-400',
}

export function RunDetailDialog({
  run,
  pipelineName,
  onClose,
  onChanged,
}: {
  run: Run | null
  pipelineName?: string
  onClose: () => void
  onChanged: () => void
}) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [nodeOutput, setNodeOutput] = useState<{ nodeId: string; data: unknown } | null>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!run) return
    setLogs([])
    setNodeOutput(null)
    setIsLoading(true)
    runsApi
      .getLogs(run.id)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setIsLoading(false))

    // Stream en direct pour les runs en cours.
    if (run.status === 'running' || run.status === 'queued') {
      setIsStreaming(true)
      stopRef.current = runsApi.streamLogs(
        run.id,
        (log) => setLogs((prev) => [...prev, log]),
        () => setIsStreaming(false),
      )
    }
    return () => {
      stopRef.current?.()
      stopRef.current = null
      setIsStreaming(false)
    }
  }, [run])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const nodeIds = Array.from(
    new Set(logs.map((l) => l.node_id).filter((id): id is string => Boolean(id))),
  )

  const loadNodeOutput = async (nodeId: string) => {
    if (!run) return
    try {
      const data = await runsApi.getNodeOutput(run.id, nodeId)
      setNodeOutput({ nodeId, data })
    } catch {
      toast.error('Sortie indisponible pour ce nœud')
    }
  }

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn()
      toast.success(msg)
      onChanged()
      onClose()
    } catch {
      toast.error('Action impossible')
    }
  }

  return (
    <Dialog open={Boolean(run)} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl">
        {run && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-mono text-base">
                #{run.id.slice(-8)}
                <RunStatusBadge status={run.status} />
                {isStreaming && (
                  <span className="flex items-center gap-1 text-xs text-blue-400">
                    <Radio className="h-3 w-3 animate-pulse" /> en direct
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            {/* Métadonnées */}
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Meta label="Pipeline" value={pipelineName ?? run.pipeline_id.slice(0, 8)} />
              <Meta label="Démarré" value={getRelativeTime(run.started_at)} />
              <Meta label="Durée" value={run.duration_ms != null ? formatDuration(run.duration_ms) : '—'} />
              <Meta label="Déclencheur" value={run.triggered_by ?? 'manuel'} />
            </div>

            {/* Sortie par nœud */}
            {nodeIds.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500">Sortie par nœud</p>
                <div className="flex flex-wrap gap-1.5">
                  {nodeIds.map((id) => (
                    <button
                      key={id}
                      onClick={() => loadNodeOutput(id)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${nodeOutput?.nodeId === id ? 'border-primary bg-primary/15 text-primary' : 'border-border text-gray-500 hover:border-[#3a3a3a]'}`}
                    >
                      {id.slice(0, 8)}
                    </button>
                  ))}
                </div>
                {nodeOutput && (
                  <pre className="max-h-40 overflow-auto rounded-lg bg-background p-3 text-xs text-emerald-300 font-mono">
                    {JSON.stringify(nodeOutput.data, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* Logs */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500">Logs</p>
              <div className="max-h-72 overflow-auto rounded-lg bg-background p-3 font-mono text-xs space-y-0.5">
                {isLoading ? (
                  <p className="text-gray-600">Chargement…</p>
                ) : logs.length === 0 ? (
                  <p className="text-gray-600">Aucun log</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-gray-700 shrink-0">{new Date(log.ts).toLocaleTimeString()}</span>
                      <Badge variant="secondary" className={`h-4 px-1 text-[9px] shrink-0 ${LEVEL_COLOR[log.level]}`}>{log.level}</Badge>
                      <span className="text-gray-300 break-all">{log.msg}</span>
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              {run.status === 'running' || run.status === 'queued' ? (
                <Button variant="outline" className="gap-2 text-amber-400" onClick={() => act(() => runsApi.cancel(run.pipeline_id, run.id), 'Exécution annulée')}>
                  <Ban className="h-4 w-4" /> Annuler
                </Button>
              ) : (
                <Button variant="outline" className="gap-2" onClick={() => act(() => runsApi.retry(run.pipeline_id, run.id), 'Exécution relancée')}>
                  <RotateCcw className="h-4 w-4" /> Relancer
                </Button>
              )}
              <Button variant="outline" className="gap-2 text-red-400" onClick={() => act(() => runsApi.remove(run.pipeline_id, run.id), 'Exécution supprimée')}>
                <Trash2 className="h-4 w-4" /> Supprimer
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-600">{label}</p>
      <p className="text-sm text-foreground truncate">{value}</p>
    </div>
  )
}
