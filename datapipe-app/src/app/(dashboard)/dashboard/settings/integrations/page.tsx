'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plug, Plus, Trash2, Power, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { integrationsApi, type AppIntegration, type IntegrationType } from '@/lib/api/integrations'
import { useWorkspaceStore } from '@/store/workspace.store'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'

const TYPES: { value: IntegrationType; label: string }[] = [
  { value: 'slack', label: 'Slack' },
  { value: 'email', label: 'Email' },
  { value: 'pagerduty', label: 'PagerDuty' },
  { value: 'jira', label: 'Jira' },
  { value: 'github', label: 'GitHub' },
  { value: 'teams', label: 'Microsoft Teams' },
]

export default function IntegrationsPage() {
  const currentOrgId = useWorkspaceStore((s) => s.currentOrgId)
  const [items, setItems] = useState<AppIntegration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'slack' as IntegrationType, configText: '{\n  \n}' })
  const [busy, setBusy] = useState(false)
  const [detail, setDetail] = useState<unknown>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try { setItems(await integrationsApi.list(currentOrgId ?? undefined)) }
    catch { toast.error('Erreur de chargement') }
    finally { setIsLoading(false) }
  }, [currentOrgId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    if (!currentOrgId) { toast.error('Aucune organisation active'); return }
    let config: Record<string, unknown> | undefined
    try { config = form.configText.trim() ? JSON.parse(form.configText) : undefined }
    catch { toast.error('Config JSON invalide'); return }
    setBusy(true)
    try {
      await integrationsApi.create({ name: form.name, type: form.type, org_id: currentOrgId, config })
      toast.success('Intégration créée')
      setShowCreate(false)
      setForm({ name: '', type: 'slack', configText: '{\n  \n}' })
      load()
    } catch { toast.error('Création impossible') } finally { setBusy(false) }
  }

  const toggleActive = async (i: AppIntegration) => {
    try { await integrationsApi.update(i.id, { active: !i.active }); toast.success('Intégration mise à jour'); load() }
    catch { toast.error('Erreur') }
  }

  const handleRemove = async (i: AppIntegration) => {
    try { await integrationsApi.remove(i.id); setItems((p) => p.filter((x) => x.id !== i.id)); toast.success('Intégration supprimée') }
    catch { toast.error('Erreur') }
  }

  const showDetail = async (i: AppIntegration) => {
    setDetail(null)
    try { setDetail(await integrationsApi.get(i.id)) } catch { toast.error('Détail indisponible') }
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Intégrations</h1>
          <p className="text-sm text-gray-500">Connectez Slack, Jira, PagerDuty et plus encore</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Nouvelle intégration</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
          <Plug className="h-10 w-10 text-gray-700" />
          <p className="text-sm text-gray-600">Aucune intégration configurée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <Card key={i.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Plug className="h-4 w-4 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{i.name}</p>
                    <Badge variant="secondary" className="text-[10px] h-5 capitalize">{i.type}</Badge>
                    {i.active != null && <Badge variant={i.active ? 'success' : 'secondary'} className="text-[10px] h-5">{i.active ? 'active' : 'inactive'}</Badge>}
                  </div>
                  {i.created_at && <p className="text-xs text-gray-600 mt-0.5">{getRelativeTime(i.created_at)}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon-sm" title="Détail" onClick={() => showDetail(i)}><Info className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon-sm" title="Activer/Désactiver" onClick={() => toggleActive(i)}><Power className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon-sm" title="Supprimer" onClick={() => handleRemove(i)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle intégration</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Alertes #ops" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as IntegrationType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Configuration (JSON)</Label>
              <Textarea className="font-mono text-xs h-24" value={form.configText} onChange={(e) => setForm({ ...form, configText: e.target.value })} placeholder='{ "webhook_url": "https://hooks.slack.com/..." }' />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={busy || !form.name.trim()}>{busy ? 'Création…' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detail != null} onOpenChange={(v) => { if (!v) setDetail(null) }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Détail de l&apos;intégration</DialogTitle></DialogHeader>
          <pre className="max-h-[55vh] overflow-auto rounded-lg bg-background p-3 text-xs text-gray-300 font-mono">{JSON.stringify(detail, null, 2)}</pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}
