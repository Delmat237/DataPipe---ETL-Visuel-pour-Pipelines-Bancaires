'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GitBranch, Play, CheckCircle2, XCircle, Plus, ArrowRight, BarChart3, FileUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth.store'
import { analyticsApi } from '@/lib/api/analytics'
import { pipelinesApi } from '@/lib/api/pipelines'
import { runsApi } from '@/lib/api/runs'
import { useWorkspaceStore } from '@/store/workspace.store'
import { formatDuration, getRelativeTime } from '@/lib/utils'
import type { WorkspaceUsage, Pipeline, Run } from '@/types'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const [usage, setUsage] = useState<WorkspaceUsage | null>(null)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [recentRuns, setRecentRuns] = useState<Run[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [usageData, pipelinesData] = await Promise.all([
          analyticsApi.getWorkspaceUsage(),
          pipelinesApi.list({ workspace_id: workspaceId, per_page: 5 }),
        ])
        setUsage(usageData)
        setPipelines(pipelinesData.data)
        // Le backend n'expose pas de liste globale de runs : on agrège les runs
        // récents des pipelines affichés.
        const runs = await runsApi.recent(pipelinesData.data.map((p) => p.id), 5)
        setRecentRuns(runs)
      } catch {}
      finally { setIsLoading(false) }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const statusVariant = (status?: string) => {
    if (status === 'success') return 'success'
    if (status === 'failed') return 'destructive'
    if (status === 'running') return 'running'
    return 'secondary'
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bonjour, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">Voici un aperçu de votre workspace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard
              icon={<GitBranch className="h-5 w-5 text-primary" />}
              label="Pipelines actifs"
              value={String(usage?.active_pipelines ?? 0)}
              bg="bg-primary/10"
            />
            <StatCard
              icon={<Play className="h-5 w-5 text-blue-400" />}
              label="Runs ce mois"
              value={String(usage?.runs_this_month ?? 0)}
              bg="bg-blue-500/10"
            />
            <StatCard
              icon={<BarChart3 className="h-5 w-5 text-purple-400" />}
              label="Lignes traitées"
              value={formatLargeNum(usage?.rows_processed_this_month ?? 0)}
              bg="bg-purple-500/10"
            />
            <StatCard
              icon={<FileUp className="h-5 w-5 text-emerald-400" />}
              label="Stockage utilisé"
              value={`${usage?.storage_used_mb ?? 0} MB`}
              bg="bg-emerald-500/10"
            />
          </>
        )}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent pipelines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Pipelines récents</CardTitle>
            <Link href="/dashboard/pipelines">
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                Voir tous <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)
            ) : pipelines.length === 0 ? (
              <EmptyState
                icon={<GitBranch className="h-8 w-8 text-gray-700" />}
                label="Aucun pipeline"
                action={<Link href="/dashboard/pipelines"><Button size="sm" className="gap-2"><Plus className="h-3.5 w-3.5" /> Créer</Button></Link>}
              />
            ) : (
              pipelines.map((p) => (
                <Link key={p.id} href={`/dashboard/pipelines/${p.id}/editor`}>
                  <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 hover:bg-card transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                        <Zap className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-gray-600">{p.nodes_count ?? 0} nœuds</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(p.last_run_status)}>
                      {p.last_run_status ?? 'idle'}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent runs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Exécutions récentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)
            ) : recentRuns.length === 0 ? (
              <EmptyState icon={<Play className="h-8 w-8 text-gray-700" />} label="Aucun run" />
            ) : (
              recentRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {run.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : run.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-blue-400 animate-spin border-t-transparent shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground font-mono">#{run.id.slice(-8)}</p>
                      <p className="text-xs text-gray-600">{getRelativeTime(run.started_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {run.duration_ms && (
                      <p className="text-xs text-gray-500">{formatDuration(run.duration_ms)}</p>
                    )}
                    {run.rows_processed && (
                      <p className="text-xs text-gray-700">{run.rows_processed} lignes</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-600">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ icon, label, action }: { icon: React.ReactNode; label: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      {icon}
      <p className="text-sm text-gray-600">{label}</p>
      {action}
    </div>
  )
}

function formatLargeNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
