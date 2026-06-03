import { DatasourcesService } from '@/lib2'
import type { Datasource } from '@/lib2'

export type DatasourceType = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'api' | 's3'

export type AppDatasource = {
  id: string
  name: string
  type: DatasourceType
  active: boolean
  sync_status: 'idle' | 'syncing' | 'error'
  last_synced_at?: string
  created_at?: string
  config?: Record<string, unknown>
}

function toDatasource(d: Datasource): AppDatasource {
  return {
    id: d.id ?? '',
    name: d.name ?? '',
    type: (d.type ?? 'postgresql') as DatasourceType,
    active: d.active ?? true,
    sync_status: (d.sync_status ?? 'idle') as AppDatasource['sync_status'],
    last_synced_at: d.last_synced_at,
    created_at: d.created_at,
    config: d.config ?? undefined,
  }
}

export const datasourcesApi = {
  async list(workspaceId = 'default'): Promise<AppDatasource[]> {
    const res = await DatasourcesService.getDatasources(workspaceId)
    return (res.datasources ?? []).map(toDatasource)
  },

  async get(id: string): Promise<AppDatasource> {
    return toDatasource(await DatasourcesService.getDatasources1(id))
  },

  async create(data: { name: string; type: DatasourceType; config?: Record<string, unknown>; workspace_id?: string }): Promise<AppDatasource> {
    return toDatasource(
      await DatasourcesService.postDatasources({
        name: data.name,
        type: data.type,
        config: data.config,
        workspace_id: data.workspace_id ?? 'default',
      }),
    )
  },

  async update(id: string, data: { name?: string; config?: Record<string, unknown>; active?: boolean }) {
    return DatasourcesService.patchDatasources(id, data)
  },

  async remove(id: string) {
    await DatasourcesService.deleteDatasources(id)
  },

  async getTypes() {
    return DatasourcesService.getDatasourcesTypes()
  },

  async getSchema(id: string) {
    return DatasourcesService.getDatasourcesSchema(id)
  },

  async sync(id: string) {
    return DatasourcesService.postDatasourcesSync(id)
  },

  async getSyncStatus(id: string) {
    return DatasourcesService.getDatasourcesSyncStatus(id)
  },

  async test(id: string): Promise<{ ok: boolean; message?: string }> {
    const res = (await DatasourcesService.postDatasourcesTest(id)) as { success?: boolean; ok?: boolean; message?: string; error?: string }
    return { ok: Boolean(res.success ?? res.ok), message: res.message ?? res.error }
  },
}
