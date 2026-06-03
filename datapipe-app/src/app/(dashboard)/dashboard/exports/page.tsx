'use client'

import { useEffect, useState } from 'react'
import { Download, Trash2, RotateCcw, FileDown, Database, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { resultsApi, type ExportItem, type ResultItem } from '@/lib/api/results'
import { pipelinesApi } from '@/lib/api/pipelines'
import { useWorkspaceStore } from '@/store/workspace.store'
import { formatBytes, getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Pipeline } from '@/types'

function statusVariant(s?: string) {
  if (s === 'completed' || s === 'ready' || s === 'success') return 'success' as const
  if (s === 'failed' || s === 'error') return 'destructive' as const
  if (s === 'pending' || s === 'processing') return 'running' as const
  return 'secondary' as const
}

export default function ExportsPage() {
  const [exports, setExports] = useState<ExportItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState('')
  const [results, setResults] = useState<ResultItem[]>([])
  const [resultsLoading, setResultsLoading] = useState(false)
  const [detail, setDetail] = useState<unknown>(null)

  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  useEffect(() => {
    loadExports()
    pipelinesApi.list({ workspace_id: workspaceId, per_page: 50 }).then((r) => setPipelines(r.data)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const loadExports = async () => {
    setIsLoading(true)
    try { setExports(await resultsApi.listExports()) }
    catch { toast.error('Erreur de chargement des exports') }
    finally { setIsLoading(false) }
  }

  const loadResults = async (pipelineId: string) => {
    setSelectedPipeline(pipelineId)
    setResultsLoading(true)
    try { setResults(await resultsApi.getPipelineResults(pipelineId)) }
    catch { toast.error('Erreur de chargement des résultats') }
    finally { setResultsLoading(false) }
  }

  const handleRemove = async (e: ExportItem) => {
    try { await resultsApi.removeExport(e.id); setExports((p) => p.filter((x) => x.id !== e.id)); toast.success('Export supprimé') }
    catch { toast.error('Erreur') }
  }

  const handleRetry = async (e: ExportItem) => {
    try { await resultsApi.retryExport(e.id); toast.success('Export relancé'); loadExports() }
    catch { toast.error('Erreur') }
  }

  const handleCreateExport = async (r: ResultItem, format: 'csv' | 'json' | 'excel') => {
    try { await resultsApi.createExport(r.id, format); toast.success(`Export ${format.toUpperCase()} créé`); loadExports() }
    catch { toast.error('Erreur') }
  }

  const showExportDetail = async (e: ExportItem) => {
    setDetail(null)
    try { setDetail(await resultsApi.getExport(e.id)) } catch { toast.error('Détail indisponible') }
  }

  const showRunResults = async (r: ResultItem) => {
    if (!r.run_id) { toast.info('Pas de run associé'); return }
    setDetail(null)
    try { setDetail(await resultsApi.getRunResults(r.run_id)) } catch { toast.error('Données indisponibles') }
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Exports &amp; résultats</h1>
        <p className="text-sm text-gray-500">Téléchargez les sorties de vos pipelines</p>
      </div>

      <Tabs defaultValue="exports">
        <TabsList>
          <TabsTrigger value="exports">Exports</TabsTrigger>
          <TabsTrigger value="results">Résultats par pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="exports" className="space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)
          ) : exports.length === 0 ? (
            <Empty icon={<FileDown className="h-8 w-8 text-gray-700" />} label="Aucun export" />
          ) : (
            exports.map((e) => (
              <Card key={e.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><FileDown className="h-4 w-4 text-primary" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground font-mono">#{e.id.slice(-8)}</p>
                      <Badge variant="secondary" className="text-[10px] h-5 uppercase">{e.format ?? '—'}</Badge>
                      <Badge variant={statusVariant(e.status)} className="text-[10px] h-5">{e.status ?? 'inconnu'}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {e.size_bytes ? `${formatBytes(e.size_bytes)} · ` : ''}{e.created_at ? getRelativeTime(e.created_at) : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon-sm" title="Détail" onClick={() => showExportDetail(e)}><Info className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon-sm" title="Télécharger" onClick={() => resultsApi.downloadExport(e)}><Download className="h-4 w-4" /></Button>
                  {statusVariant(e.status) === 'destructive' && (
                    <Button variant="ghost" size="icon-sm" title="Relancer" onClick={() => handleRetry(e)}><RotateCcw className="h-4 w-4" /></Button>
                  )}
                  <Button variant="ghost" size="icon-sm" title="Supprimer" onClick={() => handleRemove(e)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-3">
          <Select value={selectedPipeline} onValueChange={loadResults}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Choisir un pipeline" /></SelectTrigger>
            <SelectContent>
              {pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>

          {resultsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : !selectedPipeline ? (
            <Empty icon={<Database className="h-8 w-8 text-gray-700" />} label="Sélectionnez un pipeline" />
          ) : results.length === 0 ? (
            <Empty icon={<Database className="h-8 w-8 text-gray-700" />} label="Aucun résultat" />
          ) : (
            results.map((r) => (
              <Card key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground font-mono">#{r.id.slice(-8)}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {r.rows != null ? `${r.rows} lignes · ` : ''}{r.created_at ? getRelativeTime(r.created_at) : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon-sm" title="Données du run" onClick={() => showRunResults(r)}><Info className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => resultsApi.downloadResult(r.id, 'csv')}>CSV</Button>
                  <Button variant="outline" size="sm" onClick={() => resultsApi.downloadResult(r.id, 'json')}>JSON</Button>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleCreateExport(r, 'excel')}>
                    <FileDown className="h-3.5 w-3.5" /> Exporter
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={detail != null} onOpenChange={(v) => { if (!v) setDetail(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Détail</DialogTitle></DialogHeader>
          <pre className="max-h-[60vh] overflow-auto rounded-lg bg-background p-3 text-xs text-gray-300 font-mono">
            {JSON.stringify(detail, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Empty({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
      {icon}
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  )
}
