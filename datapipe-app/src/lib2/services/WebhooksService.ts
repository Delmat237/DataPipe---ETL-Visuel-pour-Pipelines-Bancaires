/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Webhook } from '../models/Webhook';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WebhooksService {
    /**
     * Webhooks d'un pipeline
     * @param pipelineId
     * @returns any Webhooks
     * @throws ApiError
     */
    public static getPipelinesWebhooks(
        pipelineId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/webhooks',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Créer un webhook
     * @param pipelineId
     * @param body
     * @returns Webhook Webhook créé
     * @throws ApiError
     */
    public static postPipelinesWebhooks(
        pipelineId: string,
        body: {
            events?: Array<string>;
            secret?: string;
            url: string;
        },
    ): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/webhooks',
            path: {
                'pipeline_id': pipelineId,
            },
            body: body,
        });
    }
    /**
     * Supprimer un webhook
     * @param pipelineId
     * @param webhookId
     * @returns any Webhook supprimé
     * @throws ApiError
     */
    public static deletePipelinesWebhooks(
        pipelineId: string,
        webhookId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pipelines/{pipeline_id}/webhooks/{webhook_id}',
            path: {
                'pipeline_id': pipelineId,
                'webhook_id': webhookId,
            },
        });
    }
    /**
     * Détail d'un webhook
     * @param pipelineId
     * @param webhookId
     * @returns any Webhook
     * @throws ApiError
     */
    public static getPipelinesWebhooks1(
        pipelineId: string,
        webhookId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/webhooks/{webhook_id}',
            path: {
                'pipeline_id': pipelineId,
                'webhook_id': webhookId,
            },
        });
    }
    /**
     * Modifier un webhook
     * @param pipelineId
     * @param webhookId
     * @param body
     * @returns any Webhook mis à jour
     * @throws ApiError
     */
    public static patchPipelinesWebhooks(
        pipelineId: string,
        webhookId: string,
        body?: any,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pipelines/{pipeline_id}/webhooks/{webhook_id}',
            path: {
                'pipeline_id': pipelineId,
                'webhook_id': webhookId,
            },
            body: body,
        });
    }
    /**
     * Envoyer un webhook de test
     * @param pipelineId
     * @param webhookId
     * @returns any Webhook de test envoyé
     * @throws ApiError
     */
    public static postPipelinesWebhooksTest(
        pipelineId: string,
        webhookId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/webhooks/{webhook_id}/test',
            path: {
                'pipeline_id': pipelineId,
                'webhook_id': webhookId,
            },
        });
    }
    /**
     * Tous les webhooks
     * @returns any Webhooks
     * @throws ApiError
     */
    public static getWebhooks(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/webhooks',
        });
    }
    /**
     * Réception d'un webhook entrant
     * @param token
     * @returns any Webhook reçu
     * @throws ApiError
     */
    public static postWebhooksInbound(
        token: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/webhooks/inbound/{token}',
            path: {
                'token': token,
            },
            errors: {
                404: `Token invalide`,
            },
        });
    }
    /**
     * Historique des événements
     * @param webhookId
     * @returns any Événements webhook
     * @throws ApiError
     */
    public static getWebhooksEvents(
        webhookId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/webhooks/{webhook_id}/events',
            path: {
                'webhook_id': webhookId,
            },
        });
    }
}
