'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Clock, Rows3, CheckCircle2, History as HistoryIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { analyticsApi, type TimelinePoint, type AuditLog } from '@/lib/api/analytics'
import { aiApi } from '@/lib/api/ai'
import { formatNumber, getRelativeTime } from '@/lib/utils'
import type { WorkspaceUsage, AIUsage } from '@/types'

export default function AnalyticsPage() {
  const [usage, setUsage] = useState<WorkspaceUsage | null>(null)
  const [aiUsage, setAiUsage] = useState<AIUsage | null>(null)
  const [timeline, setTimeline] = useState<TimelinePoint[]>([])
  const [audit, setAudit] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.getWorkspaceUsage(),
      aiApi.getUsage(),
      analyticsApi.getRunsTimeline(30).catch(() => [] as TimelinePoint[]),
      analyticsApi.getAuditLogs({ page: 1 }).catch(() => [] as AuditLog[]),
      analyticsApi.getOverview().catch(() => null),
    ]).then(([u, ai, tl, logs]) => {
      setUsage(u)
      setAiUsage(ai)
      setTimeline(tl)
      setAudit(logs)
    }).catch(() => {}).finally(() => setIsLoading(false))
  }, [])

  const maxRuns = Math.max(1, ...timeline.map((t) => t.runs ?? 0))

  const storagePercent = usage ? Math.round((usage.storage_used_mb / usage.storage_limit_mb) * 100) : 0

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <h1 className="text-xl font-bold text-foreground">Analytics</h1>

      {/* Workspace metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
          <>
            <MetricCard icon={<TrendingUp className="h-5 w-5 text-blue-400" />} label="Runs ce mois" value={String(usage?.runs_this_month ?? 0)} bg="bg-blue-500/10" />
            <MetricCard icon={<Rows3 className="h-5 w-5 text-emerald-400" />} label="Lignes traitées" value={formatNumber(usage?.rows_processed_this_month ?? 0)} bg="bg-emerald-500/10" />
            <MetricCard icon={<CheckCircle2 className="h-5 w-5 text-purple-400" />} label="Pipelines actifs" value={String(usage?.active_pipelines ?? 0)} bg="bg-purple-500/10" />
            <MetricCard icon={<Clock className="h-5 w-5 text-amber-400" />} label="Runs planifiés" value={String(usage?.scheduled_runs ?? 0)} bg="bg-amber-500/10" />
          </>
        )}
      </div>

      {/* Storage & AI quota */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Stockage</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-0">
            {isLoading ? <Skeleton className="h-16" /> : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{usage?.storage_used_mb} MB utilisés</span>
                  <span className="text-gray-600">{usage?.storage_limit_mb} MB</span>
                </div>
                <Progress value={storagePercent} className={storagePercent > 80 ? '[&>div]:bg-red-500' : ''} />
                <p className="text-xs text-gray-600">{storagePercent}% utilisé</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Quota IA (tokens)</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-0">
            {isLoading || !aiUsage ? <Skeleton className="h-16" /> : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{formatNumber(aiUsage.tokens_used)} tokens</span>
                  <span className="text-gray-600">{formatNumber(aiUsage.tokens_limit)}</span>
                </div>
                <Progress value={Math.round((aiUsage.tokens_used / aiUsage.tokens_limit) * 100)} />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Coût estimé : ${aiUsage.cost_usd.toFixed(2)}</span>
                  <span>{aiUsage.month}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {Object.entries(aiUsage.breakdown).map(([k, v]) => (
                    <div key={k} className="rounded-md bg-card px-2 py-1.5 text-center">
                      <p className="text-[10px] text-gray-600 capitalize">{k.replace('_', ' ')}</p>
                      <p className="text-xs font-semibold text-foreground">{formatNumber(v)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline des runs (30 derniers jours) */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Exécutions — 30 derniers jours</CardTitle></CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : timeline.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-600">Aucune donnée de timeline</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {timeline.map((t, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group relative" title={`${t.date} · ${t.runs ?? 0} runs`}>
                  <div className="w-full rounded-t bg-primary/30 group-hover:bg-primary/50 transition-colors" style={{ height: `${((t.runs ?? 0) / maxRuns) * 100}%` }}>
                    {(t.failed ?? 0) > 0 && (
                      <div className="w-full rounded-t bg-red-500/60" style={{ height: `${((t.failed ?? 0) / (t.runs || 1)) * 100}%` }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journal d'audit */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><HistoryIcon className="h-4 w-4" /> Journal d&apos;audit</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)
          ) : audit.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-600">Aucune entrée d&apos;audit</p>
          ) : (
            audit.slice(0, 12).map((log, i) => (
              <div key={log.id ?? i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="secondary" className="text-[10px] h-5 shrink-0">{log.action ?? 'action'}</Badge>
                  <span className="text-xs text-gray-400 truncate">{log.resource_type}{log.resource_id ? ` · ${log.resource_id.slice(0, 8)}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-600">{log.actor ?? log.user ?? 'système'}</span>
                  <span className="text-[10px] text-gray-700">{(log.created_at ?? log.ts) ? getRelativeTime((log.created_at ?? log.ts)!) : ''}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
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
