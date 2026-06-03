/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Schedule } from '../models/Schedule';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SchedulingService {
    /**
     * Supprimer le planning
     * @param pipelineId
     * @returns any Schedule supprimé
     * @throws ApiError
     */
    public static deletePipelinesSchedule(
        pipelineId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pipelines/{pipeline_id}/schedule',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Lire le planning
     * @param pipelineId
     * @returns Schedule Schedule
     * @throws ApiError
     */
    public static getPipelinesSchedule(
        pipelineId: string,
    ): CancelablePromise<Schedule> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/schedule',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Modifier le planning
     * @param pipelineId
     * @param body
     * @returns any Schedule mis à jour
     * @throws ApiError
     */
    public static patchPipelinesSchedule(
        pipelineId: string,
        body?: any,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pipelines/{pipeline_id}/schedule',
            path: {
                'pipeline_id': pipelineId,
            },
            body: body,
        });
    }
    /**
     * Créer un planning
     * @param pipelineId
     * @param body
     * @returns Schedule Schedule créé
     * @throws ApiError
     */
    public static postPipelinesSchedule(
        pipelineId: string,
        body: {
            active?: boolean;
            cron: string;
            timezone?: string;
        },
    ): CancelablePromise<Schedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/schedule',
            path: {
                'pipeline_id': pipelineId,
            },
            body: body,
        });
    }
    /**
     * Mettre en pause
     * @param pipelineId
     * @returns any Planification suspendue
     * @throws ApiError
     */
    public static postPipelinesSchedulePause(
        pipelineId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/schedule/pause',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Reprendre la planification
     * @param pipelineId
     * @returns any Planification reprise
     * @throws ApiError
     */
    public static postPipelinesScheduleResume(
        pipelineId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/schedule/resume',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Tous les plannings actifs
     * @param workspaceId
     * @returns any Plannings
     * @throws ApiError
     */
    public static getSchedules(
        workspaceId?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/schedules',
            query: {
                'workspace_id': workspaceId,
            },
        });
    }
    /**
     * Runs déclenchés par un schedule
     * @param scheduleId
     * @returns any Runs
     * @throws ApiError
     */
    public static getSchedulesRuns(
        scheduleId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/schedules/{schedule_id}/runs',
            path: {
                'schedule_id': scheduleId,
            },
        });
    }
    /**
     * Déclencher manuellement un schedule
     * @param scheduleId
     * @returns any Run déclenché
     * @throws ApiError
     */
    public static postSchedulesTrigger(
        scheduleId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/schedules/{schedule_id}/trigger',
            path: {
                'schedule_id': scheduleId,
            },
        });
    }
}
