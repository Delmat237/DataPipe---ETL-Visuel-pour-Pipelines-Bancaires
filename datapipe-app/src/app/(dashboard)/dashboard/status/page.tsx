'use client'

import { useEffect, useState } from 'react'
import { Activity, RefreshCw, Server, Boxes, Wrench, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { systemApi } from '@/lib/api/system'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Probe = { label: string; ok: boolean | null; detail?: string }

export default function StatusPage() {
  const [probes, setProbes] = useState<Probe[]>([
    { label: 'API', ok: null },
    { label: 'Liveness', ok: null },
    { label: 'Readiness (DB)', ok: null },
  ])
  const [version, setVersion] = useState<Record<string, unknown> | null>(null)
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [maintaining, setMaintaining] = useState(false)

  const [nodes, setNodes] = useState<Array<Record<string, unknown>>>([])
  const [search, setSearch] = useState('')
  const [nodesLoading, setNodesLoading] = useState(true)

  const loadHealth = async () => {
    setLoading(true)
    const next: Probe[] = []
    try { await systemApi.health(); next.push({ label: 'API', ok: true }) }
    catch { next.push({ label: 'API', ok: false }) }
    try { await systemApi.live(); next.push({ label: 'Liveness', ok: true }) }
    catch { next.push({ label: 'Liveness', ok: false }) }
    try { await systemApi.ready(); next.push({ label: 'Readiness (DB)', ok: true }) }
    catch { next.push({ label: 'Readiness (DB)', ok: false }) }
    setProbes(next)
    try { setVersion((await systemApi.version()) as Record<string, unknown>) } catch {}
    try { setMetrics((await systemApi.metrics()) as Record<string, unknown>) } catch {}
    setLoading(false)
  }

  const loadNodes = async (q?: string) => {
    setNodesLoading(true)
    try { setNodes(await systemApi.marketplaceNodes(undefined, q)) }
    catch { /* marketplace optionnel */ }
    finally { setNodesLoading(false) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadHealth(); loadNodes() }, [])

  const handleMaintenance = async () => {
    setMaintaining(true)
    try { const r = await systemApi.toggleMaintenance(); toast.success('Mode maintenance togglé'); console.debug(r) }
    catch { toast.error('Action non autorisée') }
    finally { setMaintaining(false) }
  }

  const allOk = probes.every((p) => p.ok === true)
  const anyDown = probes.some((p) => p.ok === false)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Activity className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Statut du système</h1>
            <p className="text-sm text-gray-500">Santé de l&apos;API, métriques et catalogue de nœuds</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={loadHealth} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Actualiser
        </Button>
      </div>

      {/* Health summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" /> Disponibilité</CardTitle>
            <CardDescription>État des sondes de santé</CardDescription>
          </div>
          <Badge variant={allOk ? 'success' : anyDown ? 'destructive' : 'secondary'}>
            {allOk ? 'Opérationnel' : anyDown ? 'Dégradé' : 'Vérification…'}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {probes.map((p) => (
            <div key={p.label} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5">
              <span className={cn('h-2.5 w-2.5 rounded-full shrink-0',
                p.ok === null ? 'bg-gray-600' : p.ok ? 'bg-emerald-500' : 'bg-red-500')} />
              <div>
                <p className="text-sm text-foreground">{p.label}</p>
                <p className="text-xs text-gray-600">{p.ok === null ? '…' : p.ok ? 'En ligne' : 'Indisponible'}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Version */}
        <Card>
          <CardHeader><CardTitle className="text-base">Version & build</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-20" /> : (
              <pre className="overflow-auto rounded-lg bg-background p-3 text-xs text-gray-300 font-mono">{JSON.stringify(version ?? {}, null, 2)}</pre>
            )}
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Métriques ops</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1.5 text-amber-400" onClick={handleMaintenance} disabled={maintaining}>
              <Wrench className="h-3.5 w-3.5" /> Maintenance
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-20" /> : metrics ? (
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(metrics).filter(([, v]) => typeof v === 'number').map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border px-3 py-2.5">
                    <p className="text-lg font-bold text-foreground">{String(v)}</p>
                    <p className="text-xs text-gray-600 capitalize">{k.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-600">Indisponible</p>}
          </CardContent>
        </Card>
      </div>

      {/* Marketplace nodes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Boxes className="h-4 w-4" /> Catalogue de nœuds communautaires</CardTitle>
          <CardDescription>Nœuds marketplace triés par popularité</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={(e) => { e.preventDefault(); loadNodes(search) }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              <Input className="pl-9" placeholder="Rechercher un nœud…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button type="submit" variant="outline">Rechercher</Button>
          </form>

          {nodesLoading ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : nodes.length === 0 ? (
            <p className="text-sm text-gray-600 py-4">Aucun nœud trouvé.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {nodes.map((n, i) => {
                const name = String(n.name ?? n.label ?? n.slug ?? `Nœud ${i + 1}`)
                const category = n.category != null ? String(n.category) : undefined
                const desc = n.description != null ? String(n.description) : undefined
                const installs = n.installs ?? n.popularity ?? n.downloads
                return (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{name}</p>
                      {category && <Badge variant="secondary" className="text-[10px] h-5 shrink-0">{category}</Badge>}
                    </div>
                    {desc && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{desc}</p>}
                    {installs != null && <p className="text-[11px] text-gray-700 mt-1.5">{String(installs)} installations</p>}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
