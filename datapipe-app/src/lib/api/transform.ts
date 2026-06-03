import { TransformService } from '@/lib2'

export type SqlResult = { columns: string[]; rows: Record<string, unknown>[]; error?: string }
export type SqlTemplate = { id: string; name: string; description?: string; category?: string; query?: string }
export type SqlFunction = { name: string; category?: string; signature?: string; description?: string }
export type SqlHistoryEntry = { query: string; executed_at?: string; success?: boolean; rows?: number }

function toResult(raw: unknown): SqlResult {
  const r = (raw ?? {}) as { columns?: string[]; rows?: Record<string, unknown>[]; data?: Record<string, unknown>[]; error?: string }
  const rows = r.rows ?? r.data ?? []
  const columns = r.columns ?? (rows[0] ? Object.keys(rows[0]) : [])
  return { columns, rows, error: r.error }
}

export const transformApi = {
  async validate(query: string): Promise<{ valid: boolean; message?: string }> {
    const r = (await TransformService.postTransformSqlValidate({ query })) as { valid?: boolean; ok?: boolean; error?: string; message?: string }
    return { valid: Boolean(r.valid ?? r.ok), message: r.message ?? r.error }
  },

  async execute(query: string): Promise<SqlResult> {
    return toResult(await TransformService.postTransformSqlExecute({ query }))
  },

  async preview(query: string, sampleData: unknown[]): Promise<SqlResult> {
    return toResult(await TransformService.postTransformPreview({ query, sample_data: sampleData as any[] }))
  },

  async getHistory(): Promise<SqlHistoryEntry[]> {
    const r = (await TransformService.getTransformSqlHistory()) as { history?: SqlHistoryEntry[]; queries?: SqlHistoryEntry[] }
    return r.history ?? r.queries ?? []
  },

  async getFunctions(category?: string): Promise<SqlFunction[]> {
    const r = (await TransformService.getTransformFunctions(category)) as { functions?: SqlFunction[] }
    return r.functions ?? []
  },

  async getTemplates(): Promise<SqlTemplate[]> {
    const r = (await TransformService.getTransformTemplates()) as { templates?: SqlTemplate[] }
    return r.templates ?? []
  },

  async applyTemplate(templateId: string, inputRef?: string): Promise<{ query: string }> {
    const r = (await TransformService.postTransformTemplatesApply(templateId, { input_ref: inputRef })) as { query?: string; sql?: string }
    return { query: r.query ?? r.sql ?? '' }
  },

  async generateMockData(count = 10, domain: 'banking' | 'generic' = 'banking', schema?: unknown): Promise<SqlResult> {
    return toResult(await TransformService.postTransformMockDataGenerate({ count, domain, schema }))
  },

  async chain(transforms: unknown[]) {
    return TransformService.postTransformChain({ transforms: transforms as any[] })
  },
}
