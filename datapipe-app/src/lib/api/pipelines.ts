import { PipelinesService, type Node as ApiNode, type Edge as ApiEdge } from '@/lib2'
import type { Pipeline, PaginatedResponse, PipelineVersion, PipelineTemplate } from '@/types'
import { toFlowNode, toFlowEdge } from './nodes'

type ListParams = {
  workspace_id: string
  page?: number
  per_page?: number
  search?: string
  status?: 'active' | 'archived'
  sort?: 'name' | 'updated_at' | 'last_run_at'
}

export const pipelinesApi = {
  async list(params: ListParams): Promise<PaginatedResponse<Pipeline>> {
    const res = await PipelinesService.getPipelines(
      params.workspace_id,
      params.page ?? 1,
      params.per_page ?? 20,
      params.search || undefined,
      params.status,
      params.sort,
    )
    return {
      data: (res.data ?? []) as unknown as Pipeline[],
      pagination: {
        total: res.pagination?.total ?? 0,
        page: res.pagination?.page ?? 1,
        per_page: res.pagination?.per_page ?? (params.per_page ?? 20),
      },
    }
  },

  async create(data: { name: string; workspace_id: string; description?: string; tags?: string[] }) {
    return (await PipelinesService.postPipelines(data)) as unknown as Pipeline
  },

  async get(id: string): Promise<Pipeline> {
    const raw = (await PipelinesService.getPipelines1(id)) as unknown as Pipeline & {
      nodes?: ApiNode[]
      edges?: ApiEdge[]
    }
    return {
      ...raw,
      nodes: (raw.nodes ?? []).map(toFlowNode) as unknown as Pipeline['nodes'],
      edges: (raw.edges ?? []).map(toFlowEdge) as unknown as Pipeline['edges'],
    }
  },

  async save(id: string, data: { name: string; description?: string; tags?: string[] }) {
    return (await PipelinesService.putPipelines(id, data)) as unknown as Pipeline
  },

  async patch(id: string, data: { name?: string; description?: string; tags?: string[] }) {
    return (await PipelinesService.patchPipelines(id, data)) as unknown as Pipeline
  },

  async remove(id: string) {
    await PipelinesService.deletePipelines(id)
  },

  async duplicate(id: string, name?: string) {
    return (await PipelinesService.postPipelinesDuplicate(id, { name })) as unknown as Pipeline
  },

  async archive(id: string) {
    return PipelinesService.postPipelinesArchive(id)
  },

  async restore(id: string) {
    await PipelinesService.postPipelinesRestore(id)
  },

  async publish(id: string) {
    await PipelinesService.postPipelinesPublish(id)
  },

  async unpublish(id: string) {
    await PipelinesService.postPipelinesUnpublish(id)
  },

  async getVersion(id: string, versionId: string) {
    return PipelinesService.getPipelinesVersions1(id, versionId)
  },

  async getVersions(id: string): Promise<PipelineVersion[]> {
    const res = await PipelinesService.getPipelinesVersions(id)
    return (res.versions ?? []) as unknown as PipelineVersion[]
  },

  async restoreVersion(id: string, versionId: string) {
    await PipelinesService.postPipelinesVersionsRestore(id, versionId)
  },

  async createSnapshot(id: string, label?: string) {
    await PipelinesService.postPipelinesVersionsSnapshot(id, { label })
  },

  async getDiff(id: string, versionA: string, versionB: string) {
    return PipelinesService.getPipelinesDiff(id, versionA, versionB)
  },

  async getTemplates(): Promise<PipelineTemplate[]> {
    const res = await PipelinesService.getPipelinesTemplates()
    return (res.templates ?? []) as unknown as PipelineTemplate[]
  },

  async getTemplate(templateId: string) {
    return PipelinesService.getPipelinesTemplates1(templateId)
  },

  async instantiateTemplate(templateId: string, data: { name: string; workspace_id: string }) {
    return (await PipelinesService.postPipelinesTemplatesInstantiate(templateId, data)) as unknown as Pipeline
  },

  async importPipeline(definition: unknown, workspaceId: string) {
    return (await PipelinesService.postPipelinesImport({
      definition,
      workspace_id: workspaceId,
    })) as unknown as Pipeline
  },

  async exportPipeline(id: string, format: 'json' | 'yaml' = 'json') {
    return PipelinesService.getPipelinesExport(id, format)
  },

  async merge(data: { source_id: string; target_id: string; offset_x?: number }) {
    return PipelinesService.postPipelinesMerge(data)
  },
}
