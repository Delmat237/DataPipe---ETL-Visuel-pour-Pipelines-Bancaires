/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Message } from '../models/Message';
import type { Org } from '../models/Org';
import type { OrgMember } from '../models/OrgMember';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OrganisationsService {
    /**
     * Lister mes organisations
     * @returns any Liste des orgs
     * @throws ApiError
     */
    public static getOrgs(): CancelablePromise<{
        orgs?: Array<Org>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/orgs',
        });
    }
    /**
     * Créer une organisation
     * @param body
     * @returns Org Organisation créée
     * @throws ApiError
     */
    public static postOrgs(
        body: {
            name: string;
            plan?: 'free' | 'pro' | 'enterprise';
            slug?: string;
        },
    ): CancelablePromise<Org> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/orgs',
            body: body,
            errors: {
                400: `Données invalides`,
            },
        });
    }
    /**
     * Supprimer l'organisation
     * @param orgId
     * @returns Message Organisation supprimée
     * @throws ApiError
     */
    public static deleteOrgs(
        orgId: string,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/orgs/{org_id}',
            path: {
                'org_id': orgId,
            },
            errors: {
                403: `Rôle owner requis`,
            },
        });
    }
    /**
     * Détail d'une organisation
     * @param orgId
     * @returns Org Organisation
     * @throws ApiError
     */
    public static getOrgs1(
        orgId: string,
    ): CancelablePromise<Org> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/orgs/{org_id}',
            path: {
                'org_id': orgId,
            },
            errors: {
                403: `Accès refusé`,
                404: `Organisation introuvable`,
            },
        });
    }
    /**
     * Modifier l'organisation
     * @param orgId
     * @param body
     * @returns Org Organisation mise à jour
     * @throws ApiError
     */
    public static patchOrgs(
        orgId: string,
        body?: {
            name?: string;
            settings?: any;
        },
    ): CancelablePromise<Org> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/orgs/{org_id}',
            path: {
                'org_id': orgId,
            },
            body: body,
        });
    }
    /**
     * Lister les membres
     * @param orgId
     * @returns any Membres
     * @throws ApiError
     */
    public static getOrgsMembers(
        orgId: string,
    ): CancelablePromise<{
        members?: Array<OrgMember>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/orgs/{org_id}/members',
            path: {
                'org_id': orgId,
            },
        });
    }
    /**
     * Accepter une invitation
     * @param orgId
     * @param body
     * @returns any Rejoint l'organisation
     * @throws ApiError
     */
    public static postOrgsMembersAcceptInvite(
        orgId: string,
        body: {
            token: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/orgs/{org_id}/members/accept-invite',
            path: {
                'org_id': orgId,
            },
            body: body,
        });
    }
    /**
     * Inviter un membre
     * @param orgId
     * @param body
     * @returns any Invitation envoyée
     * @throws ApiError
     */
    public static postOrgsMembersInvite(
        orgId: string,
        body: {
            email: string;
            role: 'viewer' | 'editor' | 'admin' | 'owner';
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/orgs/{org_id}/members/invite',
            path: {
                'org_id': orgId,
            },
            body: body,
            errors: {
                403: `Rôle admin requis`,
            },
        });
    }
    /**
     * Retirer un membre
     * @param orgId
     * @param userId
     * @returns Message Membre retiré
     * @throws ApiError
     */
    public static deleteOrgsMembers(
        orgId: string,
        userId: string,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/orgs/{org_id}/members/{user_id}',
            path: {
                'org_id': orgId,
                'user_id': userId,
            },
        });
    }
    /**
     * Changer le rôle d'un membre
     * @param orgId
     * @param userId
     * @param body
     * @returns any Rôle mis à jour
     * @throws ApiError
     */
    public static patchOrgsMembers(
        orgId: string,
        userId: string,
        body: {
            role: 'viewer' | 'editor' | 'admin';
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/orgs/{org_id}/members/{user_id}',
            path: {
                'org_id': orgId,
                'user_id': userId,
            },
            body: body,
        });
    }
}
