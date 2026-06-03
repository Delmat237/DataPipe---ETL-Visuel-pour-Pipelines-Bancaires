/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ResultsService {
    /**
     * Lister les exports
     * @returns any Exports
     * @throws ApiError
     */
    public static getExports(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/exports',
        });
    }
    /**
     * Supprimer un export
     * @param exportId
     * @returns any Export supprimé
     * @throws ApiError
     */
    public static deleteExports(
        exportId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/exports/{export_id}',
            path: {
                'export_id': exportId,
            },
        });
    }
    /**
     * Détail d'un export
     * @param exportId
     * @returns any Export
     * @throws ApiError
     */
    public static getExports1(
        exportId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/exports/{export_id}',
            path: {
                'export_id': exportId,
            },
        });
    }
    /**
     * Télécharger un export
     * @param exportId
     * @returns any Fichier
     * @throws ApiError
     */
    public static getExportsDownload(
        exportId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/exports/{export_id}/download',
            path: {
                'export_id': exportId,
            },
        });
    }
    /**
     * Relancer un export échoué
     * @param exportId
     * @returns any Export relancé
     * @throws ApiError
     */
    public static postExportsRetry(
        exportId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/exports/{export_id}/retry',
            path: {
                'export_id': exportId,
            },
        });
    }
    /**
     * Résultats d'un pipeline
     * @param pipelineId
     * @returns any Résultats des runs récents
     * @throws ApiError
     */
    public static getPipelinesResults(
        pipelineId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/results',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Détail d'un résultat
     * @param resultId
     * @returns any Résultat
     * @throws ApiError
     */
    public static getResults(
        resultId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/results/{result_id}',
            path: {
                'result_id': resultId,
            },
        });
    }
    /**
     * Télécharger un résultat
     * @param resultId
     * @param format
     * @returns any Fichier téléchargé
     * @throws ApiError
     */
    public static getResultsDownload(
        resultId: string,
        format: 'csv' | 'json' = 'csv',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/results/{result_id}/download',
            path: {
                'result_id': resultId,
            },
            query: {
                'format': format,
            },
        });
    }
    /**
     * Créer un export
     * @param resultId
     * @param body
     * @returns any Export créé
     * @throws ApiError
     */
    public static postResultsExport(
        resultId: string,
        body?: {
            format?: 'csv' | 'json' | 'excel';
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/results/{result_id}/export',
            path: {
                'result_id': resultId,
            },
            body: body,
        });
    }
    /**
     * Résultats d'un run
     * @param runId
     * @returns any Données produites par le run
     * @throws ApiError
     */
    public static getRunsResults(
        runId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/runs/{run_id}/results',
            path: {
                'run_id': runId,
            },
        });
    }
}
