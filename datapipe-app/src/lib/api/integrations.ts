import { ApiKeysService } from '@/lib2'

export type IntegrationType = 'slack' | 'email' | 'pagerduty' | 'jira' | 'github' | 'teams'

export type AppIntegration = {
  id: string
  name: string
  type: IntegrationType
  active?: boolean
  created_at?: string
  config?: Record<string, unknown>
}

function toIntegration(raw: unknown): AppIntegration {
  const i = (raw ?? {}) as Partial<AppIntegration> & { id?: string }
  return {
    id: i.id ?? '',
    name: i.name ?? '',
    type: (i.type ?? 'slack') as IntegrationType,
    active: i.active,
    created_at: i.created_at,
    config: i.config,
  }
}

export const integrationsApi = {
  async list(orgId?: string): Promise<AppIntegration[]> {
    const raw = (await ApiKeysService.getIntegrations(orgId)) as { integrations?: unknown[]; data?: unknown[] }
    return (raw.integrations ?? raw.data ?? []).map(toIntegration)
  },

  async get(integrationId: string) {
    return ApiKeysService.getIntegrations1(integrationId)
  },

  async create(data: { name: string; type: IntegrationType; org_id: string; config?: Record<string, unknown> }): Promise<AppIntegration> {
    return toIntegration(await ApiKeysService.postIntegrations(data))
  },

  async update(integrationId: string, data: { name?: string; config?: Record<string, unknown>; active?: boolean }) {
    return ApiKeysService.patchIntegrations(integrationId, data)
  },

  async remove(integrationId: string) {
    await ApiKeysService.deleteIntegrations(integrationId)
  },
}
