import { FilesService, type File as ApiFile } from '@/lib2'
import type { DataFile } from '@/types'

const DEFAULT_WORKSPACE = 'default'

function toDataFile(f: ApiFile): DataFile {
  return {
    id: f.id ?? '',
    name: f.name ?? '',
    size_bytes: f.size ?? 0,
    rows: f.rows_count,
    columns: f.columns_count ?? f.columns?.length,
    created_at: f.created_at ?? new Date().toISOString(),
  }
}

export const filesApi = {
  async list(workspaceId: string = DEFAULT_WORKSPACE): Promise<DataFile[]> {
    const raw = (await FilesService.getFiles(workspaceId)) as { files?: ApiFile[]; data?: ApiFile[] }
    const items = raw.files ?? raw.data ?? []
    return items.map(toDataFile)
  },

  async upload(file: File, workspaceId: string = DEFAULT_WORKSPACE): Promise<DataFile> {
    const res = await FilesService.postFilesUpload(file, workspaceId)
    return toDataFile(res)
  },

  async get(fileId: string): Promise<DataFile> {
    return toDataFile(await FilesService.getFiles1(fileId))
  },

  async remove(fileId: string) {
    await FilesService.deleteFiles(fileId)
  },

  async preview(fileId: string, limit = 20): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
    const raw = (await FilesService.getFilesPreview(fileId, limit)) as {
      columns?: string[]
      rows?: Record<string, unknown>[]
      data?: Record<string, unknown>[]
    }
    const rows = raw.rows ?? raw.data ?? []
    const columns = raw.columns ?? (rows[0] ? Object.keys(rows[0]) : [])
    return { columns, rows }
  },

  async analyze(fileId: string) {
    return FilesService.postFilesAnalyze(fileId)
  },
}
