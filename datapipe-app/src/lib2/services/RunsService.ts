/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Run } from '../models/Run';
import type { RunLog } from '../models/RunLog';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RunsService {
    /**
     * Déclencher un run
     * @param pipelineId
     * @param body
     * @returns Run Run démarré
     * @throws ApiError
     */
    public static postPipelinesRun(
        pipelineId: string,
        body?: {
            trigger?: string;
        },
    ): CancelablePromise<Run> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/run',
            path: {
                'pipeline_id': pipelineId,
            },
            body: body,
        });
    }
    /**
     * Historique des runs
     * @param pipelineId
     * @param status
     * @param page
     * @param perPage
     * @returns any Runs paginés
     * @throws ApiError
     */
    public static getPipelinesRuns(
        pipelineId: string,
        status?: string,
        page?: number,
        perPage?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/runs',
            path: {
                'pipeline_id': pipelineId,
            },
            query: {
                'status': status,
                'page': page,
                'per_page': perPage,
            },
        });
    }
    /**
     * Supprimer un run
     * @param pipelineId
     * @param runId
     * @returns any Run supprimé
     * @throws ApiError
     */
    public static deletePipelinesRuns(
        pipelineId: string,
        runId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pipelines/{pipeline_id}/runs/{run_id}',
            path: {
                'pipeline_id': pipelineId,
                'run_id': runId,
            },
        });
    }
    /**
     * Détail d'un run
     * @param pipelineId
     * @param runId
     * @returns Run Run avec résultats par nœud
     * @throws ApiError
     */
    public static getPipelinesRuns1(
        pipelineId: string,
        runId: string,
    ): CancelablePromise<Run> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/runs/{run_id}',
            path: {
                'pipeline_id': pipelineId,
                'run_id': runId,
            },
        });
    }
    /**
     * Annuler un run en cours
     * @param pipelineId
     * @param runId
     * @returns any Run annulé
     * @throws ApiError
     */
    public static postPipelinesRunsCancel(
        pipelineId: string,
        runId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/runs/{run_id}/cancel',
            path: {
                'pipeline_id': pipelineId,
                'run_id': runId,
            },
        });
    }
    /**
     * Relancer un run échoué
     * @param pipelineId
     * @param runId
     * @returns any Nouveau run créé
     * @throws ApiError
     */
    public static postPipelinesRunsRetry(
        pipelineId: string,
        runId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/runs/{run_id}/retry',
            path: {
                'pipeline_id': pipelineId,
                'run_id': runId,
            },
        });
    }
    /**
     * Logs d'un run
     * @param runId
     * @returns any Logs
     * @throws ApiError
     */
    public static getRunsLogs(
        runId: string,
    ): CancelablePromise<{
        count?: number;
        logs?: Array<RunLog>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/runs/{run_id}/logs',
            path: {
                'run_id': runId,
            },
        });
    }
    /**
     * Stream des logs en temps réel (SSE)
     * Server-Sent Events. Content-Type: text/event-stream
     * @param runId
     * @returns any Stream de logs SSE
     * @throws ApiError
     */
    public static getRunsLogsStream(
        runId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/runs/{run_id}/logs/stream',
            path: {
                'run_id': runId,
            },
        });
    }
    /**
     * Output d'un nœud pour un run donné
     * @param runId
     * @param nodeId
     * @returns any Résultat du nœud
     * @throws ApiError
     */
    public static getRunsNodesOutput(
        runId: string,
        nodeId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/runs/{run_id}/nodes/{node_id}/output',
            path: {
                'run_id': runId,
                'node_id': nodeId,
            },
        });
    }
}
