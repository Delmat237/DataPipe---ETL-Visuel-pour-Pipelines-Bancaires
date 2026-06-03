import { SchedulingService } from '@/lib2'
import type { Schedule } from '@/lib2'

export type AppSchedule = {
  id: string
  pipeline_id: string
  cron: string
  timezone: string
  active: boolean
  last_run_at?: string
  next_run_at?: string
}

function toSchedule(s: Schedule): AppSchedule {
  return {
    id: s.id ?? '',
    pipeline_id: s.pipeline_id ?? '',
    cron: s.cron ?? '',
    timezone: s.timezone ?? 'UTC',
    active: s.active ?? false,
    last_run_at: s.last_run_at,
    next_run_at: s.next_run_at,
  }
}

export const schedulingApi = {
  async listAll(workspaceId = 'default'): Promise<AppSchedule[]> {
    const raw = (await SchedulingService.getSchedules(workspaceId)) as { schedules?: Schedule[]; data?: Schedule[] }
    return (raw.schedules ?? raw.data ?? []).map(toSchedule)
  },

  async get(pipelineId: string): Promise<AppSchedule | null> {
    try {
      return toSchedule(await SchedulingService.getPipelinesSchedule(pipelineId))
    } catch {
      return null
    }
  },

  async create(pipelineId: string, data: { cron: string; timezone?: string; active?: boolean }) {
    return toSchedule(await SchedulingService.postPipelinesSchedule(pipelineId, {
      cron: data.cron,
      timezone: data.timezone ?? 'UTC',
      active: data.active ?? true,
    }))
  },

  async update(pipelineId: string, data: { cron?: string; timezone?: string; active?: boolean }) {
    return SchedulingService.patchPipelinesSchedule(pipelineId, data)
  },

  async remove(pipelineId: string) {
    await SchedulingService.deletePipelinesSchedule(pipelineId)
  },

  async pause(pipelineId: string) {
    return SchedulingService.postPipelinesSchedulePause(pipelineId)
  },

  async resume(pipelineId: string) {
    return SchedulingService.postPipelinesScheduleResume(pipelineId)
  },

  async getRuns(scheduleId: string) {
    return SchedulingService.getSchedulesRuns(scheduleId)
  },

  async trigger(scheduleId: string) {
    return SchedulingService.postSchedulesTrigger(scheduleId)
  },
}
