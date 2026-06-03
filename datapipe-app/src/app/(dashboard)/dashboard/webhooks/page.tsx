'use client'

import { useEffect, useMemo, useState } from 'react'
import { Webhook as WebhookIcon, Plus, Send, Trash2, History as HistoryIcon, Pencil, Copy, ArrowDownToLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { webhooksApi, type AppWebhook, type WebhookEvent } from '@/lib/api/webhooks'
import { pipelinesApi } from '@/lib/api/pipelines'
import { useWorkspaceStore } from '@/store/workspace.store'
import { PUBLIC_API_BASE } from '@/lib/api/client'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { Pipeline } from '@/types'

const ALL_EVENTS: WebhookEvent[] = ['run.success', 'run.error', 'run.started', 'run.cancelled']

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<AppWebhook[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AppWebhook | null>(null)
  const [form, setForm] = useState({ pipelineId: '', url: '', events: ['run.success', 'run.error'] as WebhookEvent[], active: true })
  const [busy, setBusy] = useState(false)
  const [eventsFor, setEventsFor] = useState<AppWebhook | null>(null)
  const [events, setEvents] = useState<unknown>(null)
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  const pipelineName = useMemo(() => {
    const m = new Map<string, string>()
    pipelines.forEach((p) => m.set(p.id, p.name))
    return m
  }, [pipelines])

  useEffect(() => { load() }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setIsLoading(true)
    try {
      const [wh, pls] = await Promise.all([
        webhooksApi.listAll(),
        pipelinesApi.list({ workspace_id: workspaceId, per_page: 50 }),
      ])
      setWebhooks(wh)
      setPipelines(pls.data)
    } catch { toast.error('Erreur de chargement') }
    finally { setIsLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ pipelineId: '', url: '', events: ['run.success', 'run.error'], active: true })
    setShowForm(true)
  }

  const openEdit = async (w: AppWebhook) => {
    setEditing(w)
    setForm({ pipelineId: w.pipeline_id, url: w.url, events: w.events, active: w.active })
    setShowForm(true)
    try { await webhooksApi.get(w.pipeline_id, w.id) } catch { /* détail optionnel */ }
  }

  const toggleEvent = (e: WebhookEvent) =>
    setForm((f) => ({ ...f, events: f.events.includes(e) ? f.events.filter((x) => x !== e) : [...f.events, e] }))

  const handleSubmit = async () => {
    if (!form.pipelineId || !form.url.trim()) { toast.error('Pipeline et URL requis'); return }
    setBusy(true)
    try {
      if (editing) {
        await webhooksApi.update(editing.pipeline_id, editing.id, { url: form.url, events: form.events, active: form.active })
        toast.success('Webhook mis à jour')
      } else {
        await webhooksApi.create(form.pipelineId, { url: form.url, events: form.events })
        toast.success('Webhook créé')
      }
      setShowForm(false)
      load()
    } catch { toast.error('Erreur') } finally { setBusy(false) }
  }

  const handleTest = async (w: AppWebhook) => {
    try { await webhooksApi.test(w.pipeline_id, w.id); toast.success('Webhook de test envoyé') }
    catch { toast.error('Erreur') }
  }

  const handleRemove = async (w: AppWebhook) => {
    try { await webhooksApi.remove(w.pipeline_id, w.id); setWebhooks((p) => p.filter((x) => x.id !== w.id)); toast.success('Webhook supprimé') }
    catch { toast.error('Erreur') }
  }

  const openEvents = async (w: AppWebhook) => {
    setEventsFor(w)
    setEvents(null)
    try { setEvents(await webhooksApi.getEvents(w.id)) } catch { toast.error('Événements indisponibles') }
  }

  const copyInbound = (w: AppWebhook) => {
    const url = `${PUBLIC_API_BASE}/webhooks/inbound/${w.inbound_token}`
    navigator.clipboard.writeText(url)
    toast.success('URL entrante copiée')
  }

  const simulateInbound = async (w: AppWebhook) => {
    if (!w.inbound_token) return
    try { await webhooksApi.sendInbound(w.inbound_token); toast.success('Réception entrante simulée') }
    catch { toast.error('Erreur') }
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Webhooks</h1>
          <p className="text-sm text-gray-500">{webhooks.length} webhook{webhooks.length > 1 ? 's' : ''}</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Nouveau webhook</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
          <WebhookIcon className="h-10 w-10 text-gray-700" />
          <p className="text-sm text-gray-600">Aucun webhook configuré</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((w) => (
            <Card key={w.id} className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0"><WebhookIcon className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate max-w-[260px]">{w.url}</p>
                      <Badge variant={w.active ? 'success' : 'secondary'} className="text-[10px] h-5 shrink-0">{w.active ? 'actif' : 'inactif'}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">
                      {pipelineName.get(w.pipeline_id) ?? w.pipeline_id.slice(0, 8)}
                      {w.created_at && ` · ${getRelativeTime(w.created_at)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="icon-sm" title="Tester" onClick={() => handleTest(w)}><Send className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon-sm" title="Événements" onClick={() => openEvents(w)}><HistoryIcon className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon-sm" title="Modifier" onClick={() => openEdit(w)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon-sm" title="Supprimer" onClick={() => handleRemove(w)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pl-12">
                {w.events.map((e) => <Badge key={e} variant="secondary" className="text-[10px] h-5">{e}</Badge>)}
                {w.inbound_token && (
                  <div className="ml-auto flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px]" onClick={() => copyInbound(w)}><Copy className="h-3 w-3" /> URL entrante</Button>
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-[11px]" onClick={() => simulateInbound(w)}><ArrowDownToLine className="h-3 w-3" /> Simuler</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier le webhook' : 'Nouveau webhook'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Pipeline</Label>
              <Select value={form.pipelineId} onValueChange={(v) => setForm({ ...form, pipelineId: v })} disabled={Boolean(editing)}>
                <SelectTrigger><SelectValue placeholder="Choisir un pipeline" /></SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>URL de destination</Label>
              <Input placeholder="https://exemple.com/hook" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Événements</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_EVENTS.map((e) => (
                  <button key={e} onClick={() => toggleEvent(e)} className={`rounded-full px-3 py-1 text-xs border transition-colors ${form.events.includes(e) ? 'border-primary bg-primary/15 text-primary' : 'border-border text-gray-500 hover:border-[#3a3a3a]'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            {editing && (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm text-gray-400">Actif</span>
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

      {/* Events */}
      <Dialog open={Boolean(eventsFor)} onOpenChange={(v) => { if (!v) setEventsFor(null) }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Historique des événements</DialogTitle></DialogHeader>
          {events == null ? <Skeleton className="h-32" /> : (
            <pre className="max-h-[55vh] overflow-auto rounded-lg bg-background p-3 text-xs text-gray-300 font-mono">{JSON.stringify(events, null, 2)}</pre>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
