/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TransformService {
    /**
     * Chaîner plusieurs transformations
     * @param body
     * @returns any Résumé de la chaîne
     * @throws ApiError
     */
    public static postTransformChain(
        body: {
            transforms: Array<any>;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/transform/chain',
            body: body,
        });
    }
    /**
     * Fonctions SQL disponibles
     * @param category
     * @returns any Liste des fonctions
     * @throws ApiError
     */
    public static getTransformFunctions(
        category?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/transform/functions',
            query: {
                'category': category,
            },
        });
    }
    /**
     * Générer des données fictives réalistes
     * @param body
     * @returns any Données générées
     * @throws ApiError
     */
    public static postTransformMockDataGenerate(
        body?: {
            count?: number;
            domain?: 'banking' | 'generic';
            schema?: any;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/transform/mock-data/generate',
            body: body,
        });
    }
    /**
     * Prévisualiser une transformation
     * @param body
     * @returns any Aperçu des données transformées
     * @throws ApiError
     */
    public static postTransformPreview(
        body: {
            query: string;
            sample_data: any[];
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/transform/preview',
            body: body,
        });
    }
    /**
     * Exécuter une requête SQL
     * @param body
     * @returns any Résultats de la requête
     * @throws ApiError
     */
    public static postTransformSqlExecute(
        body: {
            query: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/transform/sql/execute',
            body: body,
        });
    }
    /**
     * Historique des requêtes
     * @returns any 20 dernières requêtes
     * @throws ApiError
     */
    public static getTransformSqlHistory(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/transform/sql/history',
        });
    }
    /**
     * Valider une requête SQL
     * @param body
     * @returns any Résultat de validation
     * @throws ApiError
     */
    public static postTransformSqlValidate(
        body: {
            query: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/transform/sql/validate',
            body: body,
        });
    }
    /**
     * Templates SQL pré-définis
     * @returns any Templates SQL bancaires
     * @throws ApiError
     */
    public static getTransformTemplates(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/transform/templates',
        });
    }
    /**
     * Appliquer un template SQL
     * @param templateId
     * @param body
     * @returns any Requête SQL générée
     * @throws ApiError
     */
    public static postTransformTemplatesApply(
        templateId: string,
        body?: {
            input_ref?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/transform/templates/{template_id}/apply',
            path: {
                'template_id': templateId,
            },
            body: body,
        });
    }
}
