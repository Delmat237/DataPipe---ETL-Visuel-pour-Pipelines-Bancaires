'use client'

import { useCallback, useEffect, useState } from 'react'
import { BellRing, Plus, Trash2, Send, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { alertsApi, type AppAlert, type AlertChannel } from '@/lib/api/alerts'
import { pipelinesApi } from '@/lib/api/pipelines'
import { useWorkspaceStore } from '@/store/workspace.store'
import { toast } from 'sonner'
import type { Pipeline } from '@/types'

const CONDITIONS = [
  { value: 'run.failed', label: 'Échec d\u2019un run' },
  { value: 'run.success', label: 'Succès d\u2019un run' },
  { value: 'run.duration > 300', label: 'Durée > 5 min' },
  { value: 'rows == 0', label: 'Aucune ligne produite' },
]

export function AlertsPanel() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [alerts, setAlerts] = useState<AppAlert[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AppAlert | null>(null)
  const [form, setForm] = useState({ name: '', condition: 'run.failed', channel: 'email' as AlertChannel, pipeline_id: '', active: true })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [a, pls] = await Promise.all([
        alertsApi.list(workspaceId),
        pipelinesApi.list({ workspace_id: workspaceId, per_page: 50 }),
      ])
      setAlerts(a)
      setPipelines(pls.data)
    } catch { toast.error('Erreur de chargement des alertes') }
    finally { setIsLoading(false) }
  }, [workspaceId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', condition: 'run.failed', channel: 'email', pipeline_id: '', active: true })
    setShowForm(true)
  }

  const openEdit = async (a: AppAlert) => {
    setEditing(a)
    setForm({ name: a.name, condition: a.condition, channel: a.channel, pipeline_id: a.pipeline_id ?? '', active: a.active })
    setShowForm(true)
    try { await alertsApi.get(a.id) } catch { /* détail optionnel */ }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Nom requis'); return }
    setBusy(true)
    try {
      if (editing) {
        await alertsApi.update(editing.id, { name: form.name, condition: form.condition, channel: form.channel, active: form.active })
        toast.success('Alerte mise à jour')
      } else {
        await alertsApi.create({ name: form.name, condition: form.condition, channel: form.channel, pipeline_id: form.pipeline_id || undefined })
        toast.success('Alerte créée')
      }
      setShowForm(false)
      load()
    } catch { toast.error('Erreur') } finally { setBusy(false) }
  }

  const handleTest = async (a: AppAlert) => {
    try { await alertsApi.test(a.id); toast.success('Alerte de test envoyée') }
    catch { toast.error('Erreur') }
  }

  const handleRemove = async (a: AppAlert) => {
    try { await alertsApi.remove(a.id); setAlerts((p) => p.filter((x) => x.id !== a.id)); toast.success('Alerte supprimée') }
    catch { toast.error('Erreur') }
  }

  const pipelineName = (id?: string) => pipelines.find((p) => p.id === id)?.name

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Nouvelle alerte</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <BellRing className="h-8 w-8 text-gray-700" />
          <p className="text-sm text-gray-600">Aucune alerte configurée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <Card key={a.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10"><BellRing className="h-4 w-4 text-amber-400" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{a.name}</p>
                    <Badge variant="secondary" className="text-[10px] h-5">{a.channel}</Badge>
                    <Badge variant={a.active ? 'success' : 'secondary'} className="text-[10px] h-5">{a.active ? 'active' : 'inactive'}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    <span className="font-mono">{a.condition}</span>
                    {a.pipeline_id && ` · ${pipelineName(a.pipeline_id) ?? a.pipeline_id.slice(0, 8)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon-sm" title="Tester" onClick={() => handleTest(a)}><Send className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon-sm" title="Modifier" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon-sm" title="Supprimer" onClick={() => handleRemove(a)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier l\u2019alerte' : 'Nouvelle alerte'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Échec pipeline ventes" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v as AlertChannel })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pipeline (optionnel)</Label>
                <Select value={form.pipeline_id || 'none'} onValueChange={(v) => setForm({ ...form, pipeline_id: v === 'none' ? '' : v })} disabled={Boolean(editing)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tous</SelectItem>
                    {pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editing && (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm text-gray-400">Active</span>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={busy}>{busy ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
