'use client'

import { useEffect, useState } from 'react'
import { Camera, RotateCcw, GitCompare } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { pipelinesApi } from '@/lib/api/pipelines'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Pipeline, PipelineVersion } from '@/types'

export function PipelineVersionsDialog({
  pipeline,
  onClose,
}: {
  pipeline: Pipeline | null
  onClose: () => void
}) {
  const [versions, setVersions] = useState<PipelineVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [versionA, setVersionA] = useState<string>('')
  const [versionB, setVersionB] = useState<string>('')
  const [diff, setDiff] = useState<unknown>(null)

  useEffect(() => {
    if (!pipeline) return
    load(pipeline.id)
    setDiff(null)
    setVersionA('')
    setVersionB('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline])

  const load = async (id: string) => {
    setIsLoading(true)
    try {
      setVersions(await pipelinesApi.getVersions(id))
    } catch {
      toast.error('Erreur de chargement des versions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSnapshot = async () => {
    if (!pipeline) return
    setBusy(true)
    try {
      await pipelinesApi.createSnapshot(pipeline.id, label || undefined)
      toast.success('Snapshot créé')
      setLabel('')
      load(pipeline.id)
    } catch { toast.error('Erreur') } finally { setBusy(false) }
  }

  const handleRestore = async (v: PipelineVersion) => {
    if (!pipeline) return
    try {
      await pipelinesApi.restoreVersion(pipeline.id, v.id)
      toast.success(`Version ${v.version} restaurée`)
    } catch { toast.error('Erreur de restauration') }
  }

  const handleDiff = async () => {
    if (!pipeline || !versionA || !versionB) return
    try {
      setDiff(await pipelinesApi.getDiff(pipeline.id, versionA, versionB))
    } catch { toast.error('Comparaison impossible') }
  }

  return (
    <Dialog open={Boolean(pipeline)} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Versions — {pipeline?.name}</DialogTitle>
        </DialogHeader>

        {/* Snapshot */}
        <div className="flex items-center gap-2">
          <Input placeholder="Label du snapshot (optionnel)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Button className="gap-2 shrink-0" onClick={handleSnapshot} disabled={busy}>
            <Camera className="h-4 w-4" /> Snapshot
          </Button>
        </div>

        {/* Liste */}
        <div className="max-h-64 overflow-auto space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
          ) : versions.length === 0 ? (
            <p className="text-center text-sm text-gray-600 py-6">Aucune version enregistrée</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="h-5">v{v.version}</Badge>
                  <div>
                    <p className="text-sm text-foreground">{v.label ?? `Version ${v.version}`}</p>
                    <p className="text-xs text-gray-600">{v.author} · {getRelativeTime(v.created_at)} · {v.nodes_count} nœuds</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleRestore(v)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Restaurer
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Diff */}
        {versions.length >= 2 && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium text-gray-500">Comparer deux versions</p>
            <div className="flex items-center gap-2">
              <Select value={versionA} onValueChange={setVersionA}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Version A" /></SelectTrigger>
                <SelectContent>
                  {versions.map((v) => <SelectItem key={v.id} value={v.id}>v{v.version}{v.label ? ` — ${v.label}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={versionB} onValueChange={setVersionB}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Version B" /></SelectTrigger>
                <SelectContent>
                  {versions.map((v) => <SelectItem key={v.id} value={v.id}>v{v.version}{v.label ? ` — ${v.label}` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleDiff} disabled={!versionA || !versionB} title="Comparer">
                <GitCompare className="h-4 w-4" />
              </Button>
            </div>
            {diff != null && (
              <pre className="max-h-40 overflow-auto rounded-lg bg-background p-3 text-xs text-gray-300 font-mono">
                {JSON.stringify(diff, null, 2)}
              </pre>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
