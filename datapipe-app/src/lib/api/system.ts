import { HealthService } from '@/lib2'

export const systemApi = {
  async health() {
    return HealthService.getHealth()
  },

  async live() {
    return HealthService.getHealthLive()
  },

  async ready() {
    return HealthService.getHealthReady()
  },

  async version() {
    return HealthService.getOpsVersion()
  },

  async metrics() {
    return HealthService.getOpsMetrics()
  },

  async toggleMaintenance() {
    return HealthService.postOpsMaintenance()
  },

  async marketplaceNodes(category?: string, search?: string) {
    const raw = (await HealthService.getMarketplaceNodes(category, search)) as { nodes?: unknown[]; data?: unknown[] }
    return (raw.nodes ?? raw.data ?? []) as Array<Record<string, unknown>>
  },
}
