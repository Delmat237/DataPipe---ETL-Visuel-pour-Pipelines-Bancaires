import { ResultsService } from '@/lib2'

export type ExportItem = {
  id: string
  format?: string
  status?: string
  size_bytes?: number
  created_at?: string
  download_url?: string
  result_id?: string
}

export type ResultItem = {
  id: string
  run_id?: string
  pipeline_id?: string
  rows?: number
  created_at?: string
  node_id?: string
}

function triggerDownload(raw: unknown, fallbackName: string) {
  const obj = raw as { url?: string; download_url?: string } | string | null
  if (obj && typeof obj === 'object' && (obj.url || obj.download_url)) {
    window.open((obj.url ?? obj.download_url)!, '_blank')
    return
  }
  const content = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2)
  const blob = new Blob([content], { type: typeof raw === 'string' ? 'text/csv' : 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fallbackName
  a.click()
  URL.revokeObjectURL(url)
}

export const resultsApi = {
  async listExports(): Promise<ExportItem[]> {
    const raw = (await ResultsService.getExports()) as { exports?: ExportItem[]; data?: ExportItem[] }
    return raw.exports ?? raw.data ?? []
  },

  async getExport(id: string) {
    return ResultsService.getExports1(id)
  },

  async removeExport(id: string) {
    await ResultsService.deleteExports(id)
  },

  async downloadExport(item: ExportItem) {
    const raw = await ResultsService.getExportsDownload(item.id)
    triggerDownload(raw, `export-${item.id}.${item.format ?? 'csv'}`)
  },

  async retryExport(id: string) {
    return ResultsService.postExportsRetry(id)
  },

  async getPipelineResults(pipelineId: string): Promise<ResultItem[]> {
    const raw = (await ResultsService.getPipelinesResults(pipelineId)) as { results?: ResultItem[]; data?: ResultItem[] }
    return raw.results ?? raw.data ?? []
  },

  async getResult(resultId: string) {
    return ResultsService.getResults(resultId)
  },

  async downloadResult(resultId: string, format: 'csv' | 'json' = 'csv') {
    const raw = await ResultsService.getResultsDownload(resultId, format)
    triggerDownload(raw, `result-${resultId}.${format}`)
  },

  async createExport(resultId: string, format: 'csv' | 'json' | 'excel' = 'csv') {
    return ResultsService.postResultsExport(resultId, { format })
  },

  async getRunResults(runId: string) {
    return ResultsService.getRunsResults(runId)
  },
}
