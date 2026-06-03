import { WebhooksService } from '@/lib2'
import type { Webhook } from '@/lib2'

export type WebhookEvent = 'run.success' | 'run.error' | 'run.started' | 'run.cancelled'

export type AppWebhook = {
  id: string
  pipeline_id: string
  url: string
  events: WebhookEvent[]
  active: boolean
  inbound_token?: string
  created_at?: string
}

function toWebhook(w: Webhook): AppWebhook {
  return {
    id: w.id ?? '',
    pipeline_id: w.pipeline_id ?? '',
    url: w.url ?? '',
    events: (w.events ?? []) as WebhookEvent[],
    active: w.active ?? true,
    inbound_token: w.inbound_token,
    created_at: w.created_at,
  }
}

export const webhooksApi = {
  async listAll(): Promise<AppWebhook[]> {
    const raw = (await WebhooksService.getWebhooks()) as { webhooks?: Webhook[]; data?: Webhook[] }
    return (raw.webhooks ?? raw.data ?? []).map(toWebhook)
  },

  async listForPipeline(pipelineId: string): Promise<AppWebhook[]> {
    const raw = (await WebhooksService.getPipelinesWebhooks(pipelineId)) as { webhooks?: Webhook[]; data?: Webhook[] }
    return (raw.webhooks ?? raw.data ?? []).map(toWebhook)
  },

  async get(pipelineId: string, webhookId: string) {
    return WebhooksService.getPipelinesWebhooks1(pipelineId, webhookId)
  },

  async create(pipelineId: string, data: { url: string; events?: WebhookEvent[]; secret?: string }): Promise<AppWebhook> {
    return toWebhook(await WebhooksService.postPipelinesWebhooks(pipelineId, data))
  },

  async update(pipelineId: string, webhookId: string, data: { url?: string; events?: WebhookEvent[]; active?: boolean }) {
    return WebhooksService.patchPipelinesWebhooks(pipelineId, webhookId, data)
  },

  async remove(pipelineId: string, webhookId: string) {
    await WebhooksService.deletePipelinesWebhooks(pipelineId, webhookId)
  },

  async test(pipelineId: string, webhookId: string) {
    return WebhooksService.postPipelinesWebhooksTest(pipelineId, webhookId)
  },

  async getEvents(webhookId: string) {
    return WebhooksService.getWebhooksEvents(webhookId)
  },

  async sendInbound(token: string) {
    return WebhooksService.postWebhooksInbound(token)
  },
}
