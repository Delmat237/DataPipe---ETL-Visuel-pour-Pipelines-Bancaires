'use client'

import { useState, useEffect } from 'react'
import { Plus, Copy, Trash2, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { apiKeysApi } from '@/lib/api/apikeys'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import type { ApiKey } from '@/types'

const SCOPES = ['pipelines:read', 'pipelines:write', 'runs:write', 'files:write']

export default function ApiKeysPage() {
  const { isDemoMode } = useAuthStore()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', scopes: ['pipelines:read'] as string[] })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    if (isDemoMode) { setIsLoading(false); return }
    setIsLoading(true)
    try {
      setKeys(await apiKeysApi.list())
    } catch {} finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const result = await apiKeysApi.create(form)
      setNewKey(result.key)
      setKeys((prev) => [...prev, result])
      toast.success('Clé créée — copiez-la maintenant !')
    } catch { toast.error('Erreur') }
    finally { setIsCreating(false) }
  }

  const handleRevoke = async (key: ApiKey) => {
    try {
      await apiKeysApi.revoke(key.id)
      setKeys((prev) => prev.filter((k) => k.id !== key.id))
      toast.success('Clé révoquée')
    } catch { toast.error('Erreur') }
  }

  const toggleScope = (scope: string) => {
    setForm((f) => ({
      ...f,
      scopes: f.scopes.includes(scope) ? f.scopes.filter((s) => s !== scope) : [...f.scopes, scope],
    }))
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Clés API</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvelle clé
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">
          {isDemoMode ? 'Connectez une API pour gérer les clés' : 'Aucune clé API créée'}
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <Card key={key.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Key className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{key.name}</p>
                  <p className="text-xs text-gray-600 font-mono">{key.prefix}…</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {key.scopes.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px] h-5">{s}</Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-700">{key.last_used_at ? getRelativeTime(key.last_used_at) : 'jamais'}</p>
                <Button variant="ghost" size="icon-sm" onClick={() => handleRevoke(key)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (!v) { setNewKey(null); setForm({ name: '', scopes: ['pipelines:read'] }) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle clé API</DialogTitle></DialogHeader>
          {newKey ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                <p className="text-xs text-amber-400 font-semibold">Copiez cette clé maintenant — elle ne sera plus affichée</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-background px-3 py-2 text-xs text-emerald-400 font-mono break-all">{newKey}</code>
                  <Button size="icon-sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Copié !') }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={() => { setShowCreate(false); setNewKey(null) }}>Fermer</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input placeholder="Ex: CI/CD Key" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Scopes</Label>
                  <div className="flex flex-wrap gap-2">
                    {SCOPES.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleScope(s)}
                        className={`rounded-full px-3 py-1 text-xs border transition-colors ${form.scopes.includes(s) ? 'border-primary bg-primary/15 text-primary' : 'border-border text-gray-500 hover:border-[#3a3a3a]'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate} disabled={isCreating || !form.name.trim()}>
                  {isCreating ? 'Génération…' : 'Générer'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
