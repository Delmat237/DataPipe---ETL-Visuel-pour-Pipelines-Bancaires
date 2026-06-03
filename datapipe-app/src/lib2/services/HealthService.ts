/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthService {
    /**
     * Santé globale de l'API
     * @returns any Healthy
     * @throws ApiError
     */
    public static getHealth(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
            errors: {
                503: `Degraded`,
            },
        });
    }
    /**
     * Liveness probe
     * @returns any Alive
     * @throws ApiError
     */
    public static getHealthLive(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health/live',
        });
    }
    /**
     * Readiness probe (DB connectée ?)
     * @returns any Ready
     * @throws ApiError
     */
    public static getHealthReady(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health/ready',
            errors: {
                503: `Not ready`,
            },
        });
    }
    /**
     * Catalogue de nœuds communautaires
     * @param category
     * @param search
     * @returns any Nœuds marketplace triés par popularité
     * @throws ApiError
     */
    public static getMarketplaceNodes(
        category?: string,
        search?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/marketplace/nodes',
            query: {
                'category': category,
                'search': search,
            },
        });
    }
    /**
     * Toggle mode maintenance
     * @returns any Mode togglé
     * @throws ApiError
     */
    public static postOpsMaintenance(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ops/maintenance',
        });
    }
    /**
     * Métriques ops
     * @returns any Counters users, pipelines, runs
     * @throws ApiError
     */
    public static getOpsMetrics(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ops/metrics',
        });
    }
    /**
     * Version de l'API
     * @returns any Version et build info
     * @throws ApiError
     */
    public static getOpsVersion(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ops/version',
        });
    }
}
