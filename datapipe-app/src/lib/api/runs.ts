import { RunsService, type Run as ApiRun } from '@/lib2'
import { API_BASE, authTokens } from './client'
import type { Run, RunStatus, LogEntry } from '@/types'

function mapStatus(s?: string): RunStatus {
  if (s === 'error') return 'failed'
  if (s === 'pending') return 'queued'
  return (s as RunStatus) ?? 'queued'
}

function toRun(r: ApiRun): Run {
  return {
    id: r.id ?? '',
    status: mapStatus(r.status),
    pipeline_id: r.pipeline_id ?? '',
    duration_ms: r.duration_ms,
    started_at: r.started_at ?? new Date().toISOString(),
    finished_at: r.finished_at,
    triggered_by: r.trigger,
  }
}

export const runsApi = {
  /** Déclenche un run (remplace l'ancien /execute). */
  async run(pipelineId: string, trigger = 'manual'): Promise<Run> {
    const res = await RunsService.postPipelinesRun(pipelineId, { trigger })
    return toRun(res)
  },

  async listForPipeline(pipelineId: string, perPage = 20): Promise<Run[]> {
    const raw = (await RunsService.getPipelinesRuns(pipelineId, undefined, 1, perPage)) as {
      data?: ApiRun[]
      runs?: ApiRun[]
    }
    const items = raw.data ?? raw.runs ?? []
    return items.map(toRun)
  },

  /**
   * Runs récents agrégés sur plusieurs pipelines (le backend n'expose pas de
   * liste globale de runs — fonction reconstituée côté front).
   */
  async recent(pipelineIds: string[], limit = 5): Promise<Run[]> {
    const lists = await Promise.all(
      pipelineIds.slice(0, 5).map((id) => this.listForPipeline(id, limit).catch(() => [] as Run[])),
    )
    return lists
      .flat()
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, limit)
  },

  /**
   * Agrège les runs de plusieurs pipelines (le backend n'a pas de liste
   * globale). Renvoie tout, trié du plus récent au plus ancien.
   */
  async aggregate(pipelineIds: string[], perPipeline = 15, maxPipelines = 20): Promise<Run[]> {
    const lists = await Promise.all(
      pipelineIds.slice(0, maxPipelines).map((id) =>
        this.listForPipeline(id, perPipeline).catch(() => [] as Run[]),
      ),
    )
    return lists
      .flat()
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
  },

  async get(pipelineId: string, runId: string): Promise<Run> {
    return toRun(await RunsService.getPipelinesRuns1(pipelineId, runId))
  },

  async cancel(pipelineId: string, runId: string) {
    return RunsService.postPipelinesRunsCancel(pipelineId, runId)
  },

  async retry(pipelineId: string, runId: string) {
    return RunsService.postPipelinesRunsRetry(pipelineId, runId)
  },

  async remove(pipelineId: string, runId: string) {
    await RunsService.deletePipelinesRuns(pipelineId, runId)
  },

  async getLogs(runId: string): Promise<LogEntry[]> {
    const raw = (await RunsService.getRunsLogs(runId)) as { logs?: LogEntry[] }
    return (raw.logs ?? []) as LogEntry[]
  },

  async getNodeOutput(runId: string, nodeId: string) {
    return RunsService.getRunsNodesOutput(runId, nodeId)
  },

  /**
   * Stream SSE des logs en temps réel. Le client généré (fetch simple) ne gère
   * pas le SSE : on ouvre nous-mêmes le flux via fetch + ReadableStream pour
   * pouvoir injecter le token d'auth (EventSource ne permet pas d'en-tête).
   */
  streamLogs(
    runId: string,
    onMessage: (log: LogEntry) => void,
    onEnd?: () => void,
  ): () => void {
    const controller = new AbortController()
    const token = authTokens.getAccess()

    fetch(`${API_BASE}/runs/${runId}/logs/stream`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.body) return
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''
          for (const part of parts) {
            const line = part.split('\n').find((l) => l.startsWith('data:'))
            if (!line) continue
            try {
              onMessage(JSON.parse(line.slice(5).trim()))
            } catch {
              /* ligne non-JSON ignorée */
            }
          }
        }
        onEnd?.()
      })
      .catch(() => onEnd?.())

    return () => controller.abort()
  },
}
