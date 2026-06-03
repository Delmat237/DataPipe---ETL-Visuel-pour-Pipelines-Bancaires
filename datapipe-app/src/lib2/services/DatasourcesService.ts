/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Datasource } from '../models/Datasource';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DatasourcesService {
    /**
     * Lister les datasources
     * @param workspaceId
     * @returns any Datasources
     * @throws ApiError
     */
    public static getDatasources(
        workspaceId: string,
    ): CancelablePromise<{
        datasources?: Array<Datasource>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/datasources',
            query: {
                'workspace_id': workspaceId,
            },
        });
    }
    /**
     * Créer une datasource
     * @param body
     * @returns Datasource Datasource créée
     * @throws ApiError
     */
    public static postDatasources(
        body: {
            config?: any;
            name: string;
            type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'api' | 's3';
            workspace_id: string;
        },
    ): CancelablePromise<Datasource> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/datasources',
            body: body,
        });
    }
    /**
     * Types de datasources supportés
     * @returns any Types avec leurs schemas de config
     * @throws ApiError
     */
    public static getDatasourcesTypes(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/datasources/types',
        });
    }
    /**
     * Supprimer une datasource
     * @param dsId
     * @returns any Datasource supprimée
     * @throws ApiError
     */
    public static deleteDatasources(
        dsId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/datasources/{ds_id}',
            path: {
                'ds_id': dsId,
            },
        });
    }
    /**
     * Détail d'une datasource
     * @param dsId
     * @returns Datasource Datasource
     * @throws ApiError
     */
    public static getDatasources1(
        dsId: string,
    ): CancelablePromise<Datasource> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/datasources/{ds_id}',
            path: {
                'ds_id': dsId,
            },
        });
    }
    /**
     * Modifier une datasource
     * @param dsId
     * @param body
     * @returns any Datasource mise à jour
     * @throws ApiError
     */
    public static patchDatasources(
        dsId: string,
        body?: any,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/datasources/{ds_id}',
            path: {
                'ds_id': dsId,
            },
            body: body,
        });
    }
    /**
     * Schéma de la base de données
     * @param dsId
     * @returns any Tables et colonnes
     * @throws ApiError
     */
    public static getDatasourcesSchema(
        dsId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/datasources/{ds_id}/schema',
            path: {
                'ds_id': dsId,
            },
        });
    }
    /**
     * Synchroniser les métadonnées
     * @param dsId
     * @returns any Sync complétée
     * @throws ApiError
     */
    public static postDatasourcesSync(
        dsId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/datasources/{ds_id}/sync',
            path: {
                'ds_id': dsId,
            },
        });
    }
    /**
     * Statut de la synchronisation
     * @param dsId
     * @returns any Statut sync
     * @throws ApiError
     */
    public static getDatasourcesSyncStatus(
        dsId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/datasources/{ds_id}/sync-status',
            path: {
                'ds_id': dsId,
            },
        });
    }
    /**
     * Tester la connexion
     * @param dsId
     * @returns any Résultat du test de connexion
     * @throws ApiError
     */
    public static postDatasourcesTest(
        dsId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/datasources/{ds_id}/test',
            path: {
                'ds_id': dsId,
            },
        });
    }
}
