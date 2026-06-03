'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, GitBranch, MoreHorizontal, Zap, Archive, ArchiveRestore, Copy, Trash2, ExternalLink, Upload, Download, Rocket, History, GitMerge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { pipelinesApi } from '@/lib/api/pipelines'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import { useWorkspaceStore } from '@/store/workspace.store'
import type { Pipeline } from '@/types'
import { PipelineVersionsDialog } from './PipelineVersionsDialog'
import { MergeDialog } from './MergeDialog'

export default function PipelinesPage() {
  const router = useRouter()
  const { isDemoMode } = useAuthStore()
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [versionsFor, setVersionsFor] = useState<Pipeline | null>(null)
  const [showMerge, setShowMerge] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPipelines()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, workspaceId])

  const DEMO_PIPELINES: Pipeline[] = [
    { id: 'demo-sales', name: 'Analyse des ventes 2024', description: 'CSV → Filtre → Agrégation → Chart', status: 'active', nodes_count: 4, last_run_status: 'success', last_run_at: new Date(Date.now() - 3600000).toISOString(), workspace_id: 'demo' },
    { id: 'demo-crm',   name: 'Nettoyage CRM clients',  description: 'JSON → Dédoublon → Map → Export', status: 'active', nodes_count: 4, last_run_status: 'success', last_run_at: new Date(Date.now() - 7200000).toISOString(), workspace_id: 'demo' },
    { id: 'demo-ai',    name: 'IA Transform — revenus',  description: 'CSV → IA Transform → Aperçu', status: 'active', nodes_count: 3, last_run_status: 'failed',  last_run_at: new Date(Date.now() - 900000).toISOString(),  workspace_id: 'demo' },
  ]

  const loadPipelines = async () => {
    if (isDemoMode) {
      setIsLoading(false)
      setPipelines(DEMO_PIPELINES)
      return
    }
    setIsLoading(true)
    try {
      const res = await pipelinesApi.list({ workspace_id: workspaceId, search, status: statusFilter, per_page: 50 })
      setPipelines(res.data)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setIsCreating(true)
    try {
      const p = await pipelinesApi.create({ name: newName, workspace_id: workspaceId })
      toast.success('Pipeline créé')
      setShowCreate(false)
      setNewName('')
      router.push(`/dashboard/pipelines/${p.id}/editor`)
    } catch {
      if (isDemoMode) {
        toast.info('Mode démo — connexion API requise pour créer un pipeline')
        setShowCreate(false)
      } else {
        toast.error('Erreur lors de la création')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleDuplicate = async (p: Pipeline) => {
    try {
      await pipelinesApi.duplicate(p.id)
      toast.success('Pipeline dupliqué')
      loadPipelines()
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async (p: Pipeline) => {
    try {
      await pipelinesApi.remove(p.id)
      toast.success('Pipeline supprimé')
      loadPipelines()
    } catch { toast.error('Erreur') }
  }

  const handlePublish = async (p: Pipeline) => {
    try {
      await pipelinesApi.publish(p.id)
      toast.success('Pipeline publié')
      loadPipelines()
    } catch { toast.error('Erreur lors de la publication') }
  }

  const handleArchive = async (p: Pipeline) => {
    try {
      await pipelinesApi.archive(p.id)
      toast.success('Pipeline archivé')
      loadPipelines()
    } catch { toast.error('Erreur') }
  }

  const handleRestore = async (p: Pipeline) => {
    try {
      await pipelinesApi.restore(p.id)
      toast.success('Pipeline restauré')
      loadPipelines()
    } catch { toast.error('Erreur') }
  }

  const handleExport = async (p: Pipeline) => {
    try {
      const data = await pipelinesApi.exportPipeline(p.id, 'json')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${p.name.replace(/\s+/g, '_')}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Pipeline exporté')
    } catch { toast.error('Erreur lors de l\u2019export') }
  }

  const handleImportFile = async (file: File) => {
    try {
      const definition = JSON.parse(await file.text())
      const p = await pipelinesApi.importPipeline(definition, workspaceId)
      toast.success('Pipeline importé')
      loadPipelines()
      if (p?.id) router.push(`/dashboard/pipelines/${p.id}/editor`)
    } catch { toast.error('Fichier invalide ou import impossible') }
  }

  const statusVariant = (status?: string) => {
    if (status === 'success') return 'success'
    if (status === 'failed') return 'destructive'
    if (status === 'running') return 'running'
    return 'secondary'
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pipelines</h1>
          <p className="text-sm text-gray-500">{pipelines.length} pipeline{pipelines.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleImportFile(e.target.files[0]); e.target.value = '' }}
          />
          <Button variant="outline" className="gap-2" onClick={() => importInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Importer
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowMerge(true)} disabled={pipelines.length < 2}>
            <GitMerge className="h-4 w-4" /> Fusionner
          </Button>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nouveau pipeline
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <Input
            className="pl-9"
            placeholder="Rechercher un pipeline…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'active' | 'archived')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="archived">Archivés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : pipelines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-4">
          <GitBranch className="h-12 w-12 text-gray-700" />
          <div className="text-center">
            <p className="text-gray-400 font-medium">Aucun pipeline</p>
            <p className="text-sm text-gray-600 mt-1">
              {isDemoMode ? 'Connectez une API pour voir vos pipelines' : 'Créez votre premier pipeline pour commencer'}
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Créer un pipeline
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((p) => (
            <Card
              key={p.id}
              className="group relative cursor-pointer transition-all hover:border-border hover:shadow-lg hover:shadow-black/20"
              onClick={() => router.push(`/dashboard/pipelines/${p.id}/editor`)}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-white transition-colors">{p.name}</p>
                      <p className="text-xs text-gray-600">{p.nodes_count ?? 0} nœuds</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/pipelines/${p.id}/editor`)}>
                        <ExternalLink className="h-4 w-4" /> Ouvrir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setVersionsFor(p)}>
                        <History className="h-4 w-4" /> Versions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePublish(p)}>
                        <Rocket className="h-4 w-4" /> Publier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(p)}>
                        <Copy className="h-4 w-4" /> Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(p)}>
                        <Download className="h-4 w-4" /> Exporter (JSON)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {statusFilter === 'archived' || p.status === 'archived' ? (
                        <DropdownMenuItem onClick={() => handleRestore(p)}>
                          <ArchiveRestore className="h-4 w-4" /> Restaurer
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleArchive(p)}>
                          <Archive className="h-4 w-4" /> Archiver
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDelete(p)} className="text-red-400 focus:text-red-400">
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {p.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <Badge variant={statusVariant(p.last_run_status)} className="text-[10px] h-5">
                    {p.last_run_status ?? 'jamais exécuté'}
                  </Badge>
                  <p className="text-[10px] text-gray-700">
                    {p.last_run_at ? getRelativeTime(p.last_run_at) : '—'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nom du pipeline</Label>
              <Input
                placeholder="Ex: Réconciliation bancaire mensuelle"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={isCreating || !newName.trim()}>
              {isCreating ? 'Création…' : 'Créer et ouvrir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PipelineVersionsDialog pipeline={versionsFor} onClose={() => setVersionsFor(null)} />
      <MergeDialog
        open={showMerge}
        pipelines={pipelines}
        onClose={() => setShowMerge(false)}
        onMerged={loadPipelines}
      />
    </div>
  )
}
