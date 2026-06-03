/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { File } from '../models/File';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FilesService {
    /**
     * Lister les fichiers
     * @param workspaceId
     * @param page
     * @returns any Fichiers paginés
     * @throws ApiError
     */
    public static getFiles(
        workspaceId: string,
        page?: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/files',
            query: {
                'workspace_id': workspaceId,
                'page': page,
            },
        });
    }
    /**
     * Uploader un fichier
     * @param file
     * @param workspaceId
     * @returns File Fichier uploadé
     * @throws ApiError
     */
    public static postFilesUpload(
        file: Blob,
        workspaceId: string,
    ): CancelablePromise<File> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/files/upload',
            formData: {
                'file': file,
                'workspace_id': workspaceId,
            },
        });
    }
    /**
     * Supprimer un fichier
     * @param fileId
     * @returns any Fichier supprimé
     * @throws ApiError
     */
    public static deleteFiles(
        fileId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/files/{file_id}',
            path: {
                'file_id': fileId,
            },
        });
    }
    /**
     * Détail d'un fichier
     * @param fileId
     * @returns File Fichier
     * @throws ApiError
     */
    public static getFiles1(
        fileId: string,
    ): CancelablePromise<File> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/files/{file_id}',
            path: {
                'file_id': fileId,
            },
        });
    }
    /**
     * Analyser la qualité d'un fichier
     * @param fileId
     * @returns any Rapport de qualité des données
     * @throws ApiError
     */
    public static postFilesAnalyze(
        fileId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/files/{file_id}/analyze',
            path: {
                'file_id': fileId,
            },
        });
    }
    /**
     * Aperçu des données
     * @param fileId
     * @param limit
     * @returns any Aperçu des premières lignes
     * @throws ApiError
     */
    public static getFilesPreview(
        fileId: string,
        limit: number = 20,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/files/{file_id}/preview',
            path: {
                'file_id': fileId,
            },
            query: {
                'limit': limit,
            },
        });
    }
}
