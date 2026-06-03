import { WorkspacesService } from '@/lib2'
import type { Workspace } from '@/lib2'

export type AppWorkspace = {
  id: string
  name: string
  description?: string
  color?: string
  org_id?: string
  pipelines_count?: number
}

function toWorkspace(w: Workspace): AppWorkspace {
  return {
    id: w.id ?? '',
    name: w.name ?? '',
    description: w.description,
    color: w.color,
    org_id: w.org_id,
    pipelines_count: w.pipelines_count,
  }
}

export const workspacesApi = {
  async list(orgId: string): Promise<AppWorkspace[]> {
    const res = await WorkspacesService.getOrgsWorkspaces(orgId)
    return (res.workspaces ?? []).map(toWorkspace)
  },

  async create(orgId: string, data: { name: string; description?: string; color?: string }): Promise<AppWorkspace> {
    return toWorkspace(await WorkspacesService.postOrgsWorkspaces(orgId, data))
  },

  async get(orgId: string, wsId: string): Promise<AppWorkspace> {
    return toWorkspace(await WorkspacesService.getOrgsWorkspaces1(orgId, wsId))
  },

  async update(orgId: string, wsId: string, data: { name?: string; description?: string; color?: string }) {
    return toWorkspace(await WorkspacesService.patchOrgsWorkspaces(orgId, wsId, data))
  },

  async remove(orgId: string, wsId: string) {
    await WorkspacesService.deleteOrgsWorkspaces(orgId, wsId)
  },
}
