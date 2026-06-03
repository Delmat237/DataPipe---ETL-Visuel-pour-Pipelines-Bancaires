'use client'

import { useEffect, useState } from 'react'
import { Database, Plus, Trash2, RefreshCw, PlugZap, Table2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { datasourcesApi, type AppDatasource, type DatasourceType } from '@/lib/api/datasources'
import { useWorkspaceStore } from '@/store/workspace.store'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

const TYPES: { value: DatasourceType; label: string }[] = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'api', label: 'API REST' },
  { value: 's3', label: 'Amazon S3' },
]

const SYNC_VARIANT = { idle: 'secondary', syncing: 'running', error: 'destructive' } as const

export default function DatasourcesPage() {
  const [items, setItems] = useState<AppDatasource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'postgresql' as DatasourceType, configText: '{\n  \n}' })
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<AppDatasource | null>(null)
  const [schemaFor, setSchemaFor] = useState<AppDatasource | null>(null)
  const [schema, setSchema] = useState<unknown>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [types, setTypes] = useState<Record<string, unknown> | null>(null)
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  useEffect(() => { load() }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setIsLoading(true)
    try { setItems(await datasourcesApi.list(workspaceId)) }
    catch { toast.error('Erreur de chargement') }
    finally { setIsLoading(false) }
  }

  const openCreate = async () => {
    setShowCreate(true)
    if (!types) {
      try { setTypes((await datasourcesApi.getTypes()) as Record<string, unknown>) } catch { /* optionnel */ }
    }
  }

  const typeHint = types?.[form.type] ?? (Array.isArray(types) ? undefined : undefined)

  const handleCreate = async () => {
    if (!form.name.trim()) return
    let config: Record<string, unknown> | undefined
    try { config = form.configText.trim() ? JSON.parse(form.configText) : undefined }
    catch { toast.error('Config JSON invalide'); return }
    setBusy(true)
    try {
      await datasourcesApi.create({ name: form.name, type: form.type, config, workspace_id: workspaceId })
      toast.success('Source créée')
      setShowCreate(false)
      setForm({ name: '', type: 'postgresql', configText: '{\n  \n}' })
      load()
    } catch { toast.error('Création impossible') } finally { setBusy(false) }
  }

  const handleTest = async (ds: AppDatasource) => {
    setTestingId(ds.id)
    try {
      const res = await datasourcesApi.test(ds.id)
      res.ok ? toast.success(res.message ?? 'Connexion réussie') : toast.error(res.message ?? 'Connexion échouée')
    } catch { toast.error('Test impossible') } finally { setTestingId(null) }
  }

  const handleSync = async (ds: AppDatasource) => {
    setSyncingId(ds.id)
    try {
      await datasourcesApi.sync(ds.id)
      const status = (await datasourcesApi.getSyncStatus(ds.id)) as { sync_status?: string }
      toast.success(`Synchronisation : ${status.sync_status ?? 'lancée'}`)
      load()
    } catch { toast.error('Synchronisation impossible') } finally { setSyncingId(null) }
  }

  const openSchema = async (ds: AppDatasource) => {
    setSchemaFor(ds)
    setSchema(null)
    try { setSchema(await datasourcesApi.getSchema(ds.id)) }
    catch { toast.error('Schéma indisponible') }
  }

  const openEdit = async (ds: AppDatasource) => {
    try { setEditing(await datasourcesApi.get(ds.id)) }
    catch { setEditing(ds) }
  }

  const handleUpdate = async () => {
    if (!editing) return
    setBusy(true)
    try {
      await datasourcesApi.update(editing.id, { name: editing.name, active: editing.active })
      toast.success('Source mise à jour')
      setEditing(null)
      load()
    } catch { toast.error('Erreur') } finally { setBusy(false) }
  }

  const handleDelete = async (ds: AppDatasource) => {
    try {
      await datasourcesApi.remove(ds.id)
      setItems((prev) => prev.filter((d) => d.id !== ds.id))
      toast.success('Source supprimée')
    } catch { toast.error('Erreur') }
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sources de données</h1>
          <p className="text-sm text-gray-500">{items.length} source{items.length > 1 ? 's' : ''} connectée{items.length > 1 ? 's' : ''}</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nouvelle source
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
          <Database className="h-10 w-10 text-gray-700" />
          <p className="text-sm text-gray-600">Aucune source de données connectée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((ds) => (
            <Card key={ds.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Database className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{ds.name}</p>
                    <Badge variant="secondary" className="text-[10px] h-5 uppercase">{ds.type}</Badge>
                    <Badge variant={SYNC_VARIANT[ds.sync_status]} className="text-[10px] h-5">{ds.sync_status}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {ds.last_synced_at ? `Sync ${getRelativeTime(ds.last_synced_at)}` : 'Jamais synchronisée'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon-sm" title="Tester la connexion" onClick={() => handleTest(ds)} disabled={testingId === ds.id}>
                  <PlugZap className={`h-4 w-4 ${testingId === ds.id ? 'animate-pulse text-amber-400' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Synchroniser" onClick={() => handleSync(ds)} disabled={syncingId === ds.id}>
                  <RefreshCw className={`h-4 w-4 ${syncingId === ds.id ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Schéma" onClick={() => openSchema(ds)}>
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Modifier" onClick={() => openEdit(ds)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title="Supprimer" onClick={() => handleDelete(ds)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Création */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle source de données</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input placeholder="Ex: Prod PostgreSQL" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as DatasourceType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Configuration (JSON)</Label>
              <Textarea
                className="font-mono text-xs h-28"
                placeholder='{ "host": "localhost", "port": 5432, "database": "app" }'
                value={form.configText}
                onChange={(e) => setForm({ ...form, configText: e.target.value })}
              />
              {Boolean(typeHint) && (
                <p className="text-[11px] text-gray-600">Champs attendus : <span className="font-mono">{JSON.stringify(typeHint)}</span></p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={busy || !form.name.trim()}>{busy ? 'Création…' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Édition */}
      <Dialog open={Boolean(editing)} onOpenChange={(v) => { if (!v) setEditing(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier la source</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 py-1">
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm text-gray-400">Source active</span>
                <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={handleUpdate} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schéma */}
      <Dialog open={Boolean(schemaFor)} onOpenChange={(v) => { if (!v) setSchemaFor(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Schéma — {schemaFor?.name}</DialogTitle></DialogHeader>
          {schema == null ? (
            <Skeleton className="h-40" />
          ) : (
            <pre className="max-h-[60vh] overflow-auto rounded-lg bg-background p-3 text-xs text-gray-300 font-mono">
              {JSON.stringify(schema, null, 2)}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
