'use client'

import { useEffect, useMemo, useState } from 'react'
import { History, RefreshCw, CheckCircle2, XCircle, Clock, Ban, RotateCcw, Trash2, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { pipelinesApi } from '@/lib/api/pipelines'
import { runsApi } from '@/lib/api/runs'
import { formatDuration, getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { useWorkspaceStore } from '@/store/workspace.store'
import type { Pipeline, Run } from '@/types'
import { RunDetailDialog } from './RunDetailDialog'

export default function RunsPage() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selected, setSelected] = useState<string>('all')
  const [runs, setRuns] = useState<Run[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openRun, setOpenRun] = useState<Run | null>(null)

  const pipelineName = useMemo(() => {
    const map = new Map<string, string>()
    pipelines.forEach((p) => map.set(p.id, p.name))
    return map
  }, [pipelines])

  useEffect(() => {
    pipelinesApi
      .list({ workspace_id: workspaceId, per_page: 50 })
      .then((res) => setPipelines(res.data))
      .catch(() => {})
  }, [workspaceId])

  useEffect(() => {
    if (pipelines.length === 0) return
    loadRuns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, pipelines])

  const loadRuns = async () => {
    setIsLoading(true)
    try {
      const data =
        selected === 'all'
          ? await runsApi.aggregate(pipelines.map((p) => p.id))
          : await runsApi.listForPipeline(selected, 50)
      setRuns(data)
    } catch {
      toast.error('Erreur de chargement des exécutions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async (run: Run) => {
    try {
      await runsApi.retry(run.pipeline_id, run.id)
      toast.success('Exécution relancée')
      loadRuns()
    } catch {
      toast.error('Impossible de relancer')
    }
  }

  const handleCancel = async (run: Run) => {
    try {
      await runsApi.cancel(run.pipeline_id, run.id)
      toast.success('Exécution annulée')
      loadRuns()
    } catch {
      toast.error('Impossible d\u2019annuler')
    }
  }

  const handleDelete = async (run: Run) => {
    try {
      await runsApi.remove(run.pipeline_id, run.id)
      setRuns((prev) => prev.filter((r) => r.id !== run.id))
      toast.success('Exécution supprimée')
    } catch {
      toast.error('Erreur de suppression')
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Exécutions</h1>
          <p className="text-sm text-gray-500">{runs.length} exécution{runs.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Tous les pipelines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les pipelines</SelectItem>
              {pipelines.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadRuns} title="Rafraîchir">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <History className="h-8 w-8 text-gray-700" />
          <p className="text-sm text-gray-600">Aucune exécution pour le moment</p>
        </div>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <Card key={run.id} className="flex items-center justify-between px-4 py-3 hover:bg-card/60 transition-colors">
              <button className="flex items-center gap-3 text-left" onClick={() => setOpenRun(run)}>
                <RunStatusIcon status={run.status} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground font-mono">#{run.id.slice(-8)}</p>
                    {selected === 'all' && (
                      <span className="text-xs text-gray-500 truncate max-w-[180px]">
                        {pipelineName.get(run.pipeline_id) ?? run.pipeline_id}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RunStatusBadge status={run.status} />
                    {run.triggered_by && <span className="text-xs text-gray-700">· {run.triggered_by}</span>}
                    <span className="text-xs text-gray-700">· {getRelativeTime(run.started_at)}</span>
                    {run.duration_ms != null && <span className="text-xs text-gray-700">· {formatDuration(run.duration_ms)}</span>}
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon-sm" title="Logs / détail" onClick={() => setOpenRun(run)}>
                  <ScrollText className="h-4 w-4" />
                </Button>
                {run.status === 'running' || run.status === 'queued' ? (
                  <Button variant="ghost" size="icon-sm" title="Annuler" onClick={() => handleCancel(run)} className="text-amber-400 hover:text-amber-300">
                    <Ban className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon-sm" title="Relancer" onClick={() => handleRetry(run)}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" title="Supprimer" onClick={() => handleDelete(run)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RunDetailDialog
        run={openRun}
        pipelineName={openRun ? pipelineName.get(openRun.pipeline_id) : undefined}
        onClose={() => setOpenRun(null)}
        onChanged={loadRuns}
      />
    </div>
  )
}

function RunStatusIcon({ status }: { status: Run['status'] }) {
  if (status === 'success') return <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
  if (status === 'failed') return <XCircle className="h-5 w-5 text-red-400 shrink-0" />
  if (status === 'cancelled') return <Ban className="h-5 w-5 text-gray-500 shrink-0" />
  if (status === 'running') return <div className="h-5 w-5 rounded-full border-2 border-blue-400 animate-spin border-t-transparent shrink-0" />
  return <Clock className="h-5 w-5 text-gray-500 shrink-0" />
}

export function RunStatusBadge({ status }: { status: Run['status'] }) {
  const variant = status === 'success' ? 'success' : status === 'failed' ? 'destructive' : status === 'running' ? 'running' : 'secondary'
  return <Badge variant={variant} className="text-[10px] h-5">{status}</Badge>
}
