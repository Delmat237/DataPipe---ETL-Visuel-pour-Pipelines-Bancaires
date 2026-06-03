/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AnalyticsService {
    /**
     * Vue d'ensemble des métriques
     * @param workspaceId
     * @returns any KPIs globaux (runs, success rate, data processed)
     * @throws ApiError
     */
    public static getAnalyticsOverview(
        workspaceId?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/analytics/overview',
            query: {
                'workspace_id': workspaceId,
            },
        });
    }
    /**
     * Statistiques d'un pipeline
     * @param pipelineId
     * @returns any Stats détaillées + historique quotidien
     * @throws ApiError
     */
    public static getAnalyticsPipelinesStats(
        pipelineId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/analytics/pipelines/{pipeline_id}/stats',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Timeline des runs
     * @param workspaceId
     * @param days
     * @returns any Runs par jour sur N jours
     * @throws ApiError
     */
    public static getAnalyticsRunsTimeline(
        workspaceId?: string,
        days: number = 30,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/analytics/runs/timeline',
            query: {
                'workspace_id': workspaceId,
                'days': days,
            },
        });
    }
    /**
     * Utilisation du mois courant
     * @returns any API calls, stockage, runs, tokens IA
     * @throws ApiError
     */
    public static getAnalyticsUsage(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/analytics/usage',
        });
    }
    /**
     * Logs d'audit
     * @param orgId
     * @param action
     * @param resourceType
     * @param page
     * @returns any Logs d'audit paginés
     * @throws ApiError
     */
    public static getAuditLogs(
        orgId?: string,
        action?: string,
        resourceType?: string,
        page?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/audit/logs',
            query: {
                'org_id': orgId,
                'action': action,
                'resource_type': resourceType,
                'page': page,
            },
        });
    }
    /**
     * Détail d'un log
     * @param logId
     * @returns any Log d'audit
     * @throws ApiError
     */
    public static getAuditLogs1(
        logId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/audit/logs/{log_id}',
            path: {
                'log_id': logId,
            },
        });
    }
}
