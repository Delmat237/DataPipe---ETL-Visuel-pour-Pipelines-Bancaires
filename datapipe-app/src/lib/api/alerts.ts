import { NotificationsService } from '@/lib2'
import type { Alert } from '@/lib2'

export type AlertChannel = 'email' | 'slack' | 'sms'

export type AppAlert = {
  id: string
  name: string
  condition: string
  channel: AlertChannel
  active: boolean
  pipeline_id?: string
  created_at?: string
}

function toAlert(a: Alert): AppAlert {
  return {
    id: a.id ?? '',
    name: a.name ?? '',
    condition: a.condition ?? '',
    channel: (a.channel ?? 'email') as AlertChannel,
    active: a.active ?? true,
    pipeline_id: a.pipeline_id,
    created_at: a.created_at,
  }
}

export const alertsApi = {
  async list(workspaceId = 'default'): Promise<AppAlert[]> {
    const raw = (await NotificationsService.getAlerts(workspaceId)) as { alerts?: Alert[]; data?: Alert[] }
    return (raw.alerts ?? raw.data ?? []).map(toAlert)
  },

  async get(alertId: string) {
    return NotificationsService.getAlerts1(alertId)
  },

  async create(data: { name: string; condition: string; channel?: AlertChannel; pipeline_id?: string; recipients?: string[] }): Promise<AppAlert> {
    return toAlert(await NotificationsService.postAlerts(data))
  },

  async update(alertId: string, data: { name?: string; condition?: string; channel?: AlertChannel; active?: boolean }) {
    return NotificationsService.patchAlerts(alertId, data)
  },

  async remove(alertId: string) {
    await NotificationsService.deleteAlerts(alertId)
  },

  async test(alertId: string) {
    return NotificationsService.postAlertsTest(alertId)
  },
}
