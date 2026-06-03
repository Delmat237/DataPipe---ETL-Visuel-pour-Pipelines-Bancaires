import { NotificationsService } from '@/lib2'
import type { Notification } from '@/types'

export const notificationsApi = {
  async list(): Promise<{ notifications: Notification[]; unread_count: number }> {
    const raw = (await NotificationsService.getNotifications()) as {
      notifications?: Notification[]
      unread_count?: number
    }
    return {
      notifications: (raw.notifications ?? []) as Notification[],
      unread_count: raw.unread_count ?? 0,
    }
  },

  async markRead(notifId: string) {
    await NotificationsService.patchNotificationsRead(notifId)
  },

  async markAllRead() {
    await NotificationsService.postNotificationsMarkAllRead()
  },

  async remove(notifId: string) {
    await NotificationsService.deleteNotifications(notifId)
  },
}
