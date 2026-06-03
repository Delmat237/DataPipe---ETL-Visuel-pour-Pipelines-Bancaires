/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Message } from '../models/Message';
import type { Workspace } from '../models/Workspace';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WorkspacesService {
    /**
     * Lister les workspaces
     * @param orgId
     * @returns any Workspaces
     * @throws ApiError
     */
    public static getOrgsWorkspaces(
        orgId: string,
    ): CancelablePromise<{
        workspaces?: Array<Workspace>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/orgs/{org_id}/workspaces',
            path: {
                'org_id': orgId,
            },
        });
    }
    /**
     * Créer un workspace
     * @param orgId
     * @param body
     * @returns Workspace Workspace créé
     * @throws ApiError
     */
    public static postOrgsWorkspaces(
        orgId: string,
        body: {
            color?: string;
            description?: string;
            name: string;
        },
    ): CancelablePromise<Workspace> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/orgs/{org_id}/workspaces',
            path: {
                'org_id': orgId,
            },
            body: body,
        });
    }
    /**
     * Supprimer un workspace
     * @param orgId
     * @param wsId
     * @returns Message Workspace supprimé
     * @throws ApiError
     */
    public static deleteOrgsWorkspaces(
        orgId: string,
        wsId: string,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/orgs/{org_id}/workspaces/{ws_id}',
            path: {
                'org_id': orgId,
                'ws_id': wsId,
            },
        });
    }
    /**
     * Détail d'un workspace
     * @param orgId
     * @param wsId
     * @returns Workspace Workspace
     * @throws ApiError
     */
    public static getOrgsWorkspaces1(
        orgId: string,
        wsId: string,
    ): CancelablePromise<Workspace> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/orgs/{org_id}/workspaces/{ws_id}',
            path: {
                'org_id': orgId,
                'ws_id': wsId,
            },
        });
    }
    /**
     * Modifier un workspace
     * @param orgId
     * @param wsId
     * @param body
     * @returns Workspace Workspace mis à jour
     * @throws ApiError
     */
    public static patchOrgsWorkspaces(
        orgId: string,
        wsId: string,
        body?: {
            color?: string;
            description?: string;
            name?: string;
        },
    ): CancelablePromise<Workspace> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/orgs/{org_id}/workspaces/{ws_id}',
            path: {
                'org_id': orgId,
                'ws_id': wsId,
            },
            body: body,
        });
    }
}
