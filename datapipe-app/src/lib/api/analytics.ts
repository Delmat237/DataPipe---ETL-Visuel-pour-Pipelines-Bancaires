import { AnalyticsService } from '@/lib2'
import type { WorkspaceUsage, PipelineAnalytics } from '@/types'

/**
 * Récupère l'usage du workspace.
 * Backend : GET /analytics/usage (remplace l'ancien /analytics/workspace/usage).
 */
export const analyticsApi = {
  async getWorkspaceUsage(): Promise<WorkspaceUsage> {
    const raw = (await AnalyticsService.getAnalyticsUsage()) as Record<string, unknown>
    return {
      storage_used_mb: Number(raw.storage_used_mb ?? 0),
      storage_limit_mb: Number(raw.storage_limit_mb ?? 1024),
      runs_this_month: Number(raw.runs_this_month ?? 0),
      rows_processed_this_month: Number(raw.rows_processed_this_month ?? 0),
      active_pipelines: Number(raw.active_pipelines ?? 0),
      scheduled_runs: Number(raw.scheduled_runs ?? 0),
    }
  },

  async getOverview(workspaceId = 'default') {
    return AnalyticsService.getAnalyticsOverview(workspaceId)
  },

  async getPipelineStats(pipelineId: string): Promise<PipelineAnalytics> {
    return (await AnalyticsService.getAnalyticsPipelinesStats(pipelineId)) as unknown as PipelineAnalytics
  },

  async getRunsTimeline(days = 30, workspaceId = 'default'): Promise<TimelinePoint[]> {
    const raw = (await AnalyticsService.getAnalyticsRunsTimeline(workspaceId, days)) as {
      timeline?: TimelinePoint[]
      data?: TimelinePoint[]
    }
    return raw.timeline ?? raw.data ?? []
  },

  async getAuditLogs(params: { action?: string; resourceType?: string; page?: number } = {}): Promise<AuditLog[]> {
    const raw = (await AnalyticsService.getAuditLogs(undefined, params.action, params.resourceType, params.page)) as {
      logs?: AuditLog[]
      data?: AuditLog[]
    }
    return raw.logs ?? raw.data ?? []
  },

  async getAuditLog(logId: string) {
    return AnalyticsService.getAuditLogs1(logId)
  },
}

export type TimelinePoint = { date: string; runs?: number; success?: number; failed?: number }
export type AuditLog = {
  id?: string
  action?: string
  resource_type?: string
  resource_id?: string
  actor?: string
  user?: string
  created_at?: string
  ts?: string
}
