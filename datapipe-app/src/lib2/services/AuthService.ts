/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoginResponse } from '../models/LoginResponse';
import type { Message } from '../models/Message';
import type { Session } from '../models/Session';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Changer le mot de passe
     * @param body
     * @returns any Mot de passe changé, toutes les sessions révoquées
     * @throws ApiError
     */
    public static postAuthChangePassword(
        body: {
            current_password: string;
            new_password: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/change-password',
            body: body,
            errors: {
                400: `Mot de passe actuel incorrect`,
            },
        });
    }
    /**
     * Demander une réinitialisation
     * @param body
     * @returns Message Email envoyé (réponse identique si compte inexistant)
     * @throws ApiError
     */
    public static postAuthForgotPassword(
        body: {
            email: string;
        },
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/forgot-password',
            body: body,
        });
    }
    /**
     * Se connecter
     * Retourne un access_token (15min) et un refresh_token (30j).
     * @param body
     * @returns LoginResponse Connexion réussie
     * @throws ApiError
     */
    public static postAuthLogin(
        body: {
            email: string;
            password: string;
        },
    ): CancelablePromise<LoginResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/login',
            body: body,
            errors: {
                401: `Identifiants invalides`,
            },
        });
    }
    /**
     * Se déconnecter
     * Invalide la session courante. Le refresh_token est blacklisté.
     * @param body
     * @returns Message Déconnecté
     * @throws ApiError
     */
    public static postAuthLogout(
        body?: {
            refresh_token?: string;
        },
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/logout',
            body: body,
        });
    }
    /**
     * Supprimer son compte
     * @param body
     * @returns Message Compte supprimé
     * @throws ApiError
     */
    public static deleteAuthMe(
        body: {
            password: string;
        },
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/auth/me',
            body: body,
            errors: {
                400: `Mot de passe incorrect`,
            },
        });
    }
    /**
     * Profil de l'utilisateur connecté
     * @returns User Profil
     * @throws ApiError
     */
    public static getAuthMe(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/me',
        });
    }
    /**
     * Modifier son profil
     * @param body
     * @returns any Profil mis à jour
     * @throws ApiError
     */
    public static patchAuthMe(
        body?: {
            avatar_url?: string;
            name?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/auth/me',
            body: body,
        });
    }
    /**
     * Rafraîchir le token d'accès
     * Échange un refresh_token valide contre un nouvel access_token (rotation).
     * @param body
     * @returns any Nouveau token
     * @throws ApiError
     */
    public static postAuthRefreshToken(
        body: {
            refresh_token: string;
        },
    ): CancelablePromise<{
        access_token?: string;
        expires_in?: number;
        refresh_token?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/refresh-token',
            body: body,
            errors: {
                401: `Refresh token invalide`,
            },
        });
    }
    /**
     * Créer un compte
     * Enregistre un nouvel utilisateur. Envoie un email de vérification.
     * @param body
     * @returns any Compte créé
     * @throws ApiError
     */
    public static postAuthRegister(
        body: {
            email: string;
            name: string;
            org_name?: string;
            password: string;
        },
    ): CancelablePromise<{
        message?: string;
        user?: User;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/register',
            body: body,
            errors: {
                400: `Données invalides`,
                409: `Email déjà utilisé`,
            },
        });
    }
    /**
     * Réinitialiser le mot de passe
     * @param body
     * @returns Message Mot de passe réinitialisé
     * @throws ApiError
     */
    public static postAuthResetPassword(
        body: {
            new_password: string;
            token: string;
        },
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/reset-password',
            body: body,
            errors: {
                400: `Token invalide ou expiré`,
            },
        });
    }
    /**
     * Révoquer toutes les sessions
     * @param body
     * @returns any Sessions révoquées
     * @throws ApiError
     */
    public static postAuthRevokeAllSessions(
        body?: {
            except_current?: boolean;
        },
    ): CancelablePromise<{
        message?: string;
        revoked_count?: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/revoke-all-sessions',
            body: body,
        });
    }
    /**
     * Lister les sessions actives
     * @returns any Sessions
     * @throws ApiError
     */
    public static getAuthSessions(): CancelablePromise<{
        sessions?: Array<Session>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/sessions',
        });
    }
    /**
     * Révoquer une session
     * @param sessionId
     * @returns Message Session révoquée
     * @throws ApiError
     */
    public static deleteAuthSessions(
        sessionId: string,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/auth/sessions/{session_id}',
            path: {
                'session_id': sessionId,
            },
            errors: {
                404: `Session introuvable`,
            },
        });
    }
    /**
     * Vérifier l'email
     * @param body
     * @returns any Email vérifié, retourne un access_token
     * @throws ApiError
     */
    public static postAuthVerifyEmail(
        body: {
            token: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/verify-email',
            body: body,
        });
    }
}
