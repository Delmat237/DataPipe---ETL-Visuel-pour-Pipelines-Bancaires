'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutTemplate, Boxes, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { pipelinesApi } from '@/lib/api/pipelines'
import { useWorkspaceStore } from '@/store/workspace.store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { PipelineTemplate } from '@/types'

export default function TemplatesPage() {
  const router = useRouter()
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [templates, setTemplates] = useState<PipelineTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [category, setCategory] = useState<string>('all')
  const [selected, setSelected] = useState<PipelineTemplate | null>(null)
  const [detail, setDetail] = useState<unknown>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    pipelinesApi
      .getTemplates()
      .then(setTemplates)
      .catch(() => toast.error('Erreur de chargement des templates'))
      .finally(() => setIsLoading(false))
  }, [])

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(templates.map((t) => t.category).filter(Boolean)))],
    [templates],
  )
  const visible = category === 'all' ? templates : templates.filter((t) => t.category === category)

  const openTemplate = async (t: PipelineTemplate) => {
    setSelected(t)
    setName(`${t.name}`)
    setDetail(null)
    try {
      setDetail(await pipelinesApi.getTemplate(t.id))
    } catch { /* le détail est optionnel */ }
  }

  const handleUse = async () => {
    if (!selected || !name.trim()) return
    setBusy(true)
    try {
      const p = await pipelinesApi.instantiateTemplate(selected.id, { name, workspace_id: workspaceId })
      toast.success('Pipeline créé depuis le template')
      setSelected(null)
      router.push(`/dashboard/pipelines/${p.id}/editor`)
    } catch { toast.error('Création impossible') } finally { setBusy(false) }
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Templates</h1>
        <p className="text-sm text-gray-500">Démarrez un pipeline à partir d&apos;un modèle prêt à l&apos;emploi</p>
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors capitalize',
                category === c ? 'border-primary bg-primary/15 text-primary' : 'border-border text-gray-500 hover:border-[#3a3a3a]',
              )}
            >
              {c === 'all' ? 'Tous' : c}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 gap-3">
          <LayoutTemplate className="h-10 w-10 text-gray-700" />
          <p className="text-sm text-gray-600">Aucun template disponible</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <Card key={t.id} className="group cursor-pointer p-4 space-y-3 transition-all hover:border-border hover:shadow-lg hover:shadow-black/20" onClick={() => openTemplate(t)}>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Boxes className="h-5 w-5 text-primary" />
                </div>
                {t.category && <Badge variant="secondary" className="text-[10px] h-5 capitalize">{t.category}</Badge>}
              </div>
              <div>
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{t.description}</p>
              </div>
              <p className="text-[11px] text-gray-700">{t.nodes_count} nœuds</p>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(v) => { if (!v) setSelected(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-gray-500">{selected?.description}</p>
            {Boolean(detail) && (
              <pre className="max-h-40 overflow-auto rounded-lg bg-background p-3 text-xs text-gray-400 font-mono">
                {JSON.stringify(detail, null, 2)}
              </pre>
            )}
            <div className="space-y-1.5">
              <Label>Nom du nouveau pipeline</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Annuler</Button>
            <Button onClick={handleUse} disabled={busy || !name.trim()}>
              {busy ? 'Création…' : 'Utiliser ce template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
