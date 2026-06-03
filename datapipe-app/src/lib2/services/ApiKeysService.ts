/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiKey } from '../models/ApiKey';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ApiKeysService {
    /**
     * Mes clés API
     * @returns any Clés API
     * @throws ApiError
     */
    public static getApiKeys(): CancelablePromise<{
        api_keys?: Array<ApiKey>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api-keys',
        });
    }
    /**
     * Créer une clé API
     * @param body
     * @returns any Clé créée — à sauvegarder maintenant (non ré-affichée)
     * @throws ApiError
     */
    public static postApiKeys(
        body: {
            name: string;
            org_id?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api-keys',
            body: body,
        });
    }
    /**
     * Révoquer une clé
     * @param keyId
     * @returns any Clé révoquée
     * @throws ApiError
     */
    public static deleteApiKeys(
        keyId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api-keys/{key_id}',
            path: {
                'key_id': keyId,
            },
        });
    }
    /**
     * Lister les intégrations
     * @param orgId
     * @returns any Intégrations
     * @throws ApiError
     */
    public static getIntegrations(
        orgId?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations',
            query: {
                'org_id': orgId,
            },
        });
    }
    /**
     * Créer une intégration
     * @param body
     * @returns any Intégration créée
     * @throws ApiError
     */
    public static postIntegrations(
        body: {
            config?: any;
            name: string;
            org_id: string;
            type: 'slack' | 'email' | 'pagerduty' | 'jira' | 'github' | 'teams';
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/integrations',
            body: body,
        });
    }
    /**
     * Supprimer une intégration
     * @param integrationId
     * @returns any Intégration supprimée
     * @throws ApiError
     */
    public static deleteIntegrations(
        integrationId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/integrations/{integration_id}',
            path: {
                'integration_id': integrationId,
            },
        });
    }
    /**
     * Détail d'une intégration
     * @param integrationId
     * @returns any Intégration
     * @throws ApiError
     */
    public static getIntegrations1(
        integrationId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/{integration_id}',
            path: {
                'integration_id': integrationId,
            },
        });
    }
    /**
     * Modifier une intégration
     * @param integrationId
     * @param body
     * @returns any Intégration mise à jour
     * @throws ApiError
     */
    public static patchIntegrations(
        integrationId: string,
        body?: any,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/integrations/{integration_id}',
            path: {
                'integration_id': integrationId,
            },
            body: body,
        });
    }
}
