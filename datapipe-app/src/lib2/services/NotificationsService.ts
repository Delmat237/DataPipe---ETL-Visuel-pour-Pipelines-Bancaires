/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Alert } from '../models/Alert';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NotificationsService {
    /**
     * Lister les alertes
     * @param workspaceId
     * @returns any Alertes
     * @throws ApiError
     */
    public static getAlerts(
        workspaceId?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/alerts',
            query: {
                'workspace_id': workspaceId,
            },
        });
    }
    /**
     * Créer une alerte
     * @param body
     * @returns Alert Alerte créée
     * @throws ApiError
     */
    public static postAlerts(
        body: {
            channel?: 'email' | 'slack' | 'sms';
            condition: string;
            name: string;
            pipeline_id?: string;
            recipients?: Array<string>;
        },
    ): CancelablePromise<Alert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/alerts',
            body: body,
        });
    }
    /**
     * Supprimer une alerte
     * @param alertId
     * @returns any Alerte supprimée
     * @throws ApiError
     */
    public static deleteAlerts(
        alertId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/alerts/{alert_id}',
            path: {
                'alert_id': alertId,
            },
        });
    }
    /**
     * Détail d'une alerte
     * @param alertId
     * @returns any Alerte
     * @throws ApiError
     */
    public static getAlerts1(
        alertId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/alerts/{alert_id}',
            path: {
                'alert_id': alertId,
            },
        });
    }
    /**
     * Modifier une alerte
     * @param alertId
     * @param body
     * @returns any Alerte mise à jour
     * @throws ApiError
     */
    public static patchAlerts(
        alertId: string,
        body?: any,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/alerts/{alert_id}',
            path: {
                'alert_id': alertId,
            },
            body: body,
        });
    }
    /**
     * Tester une alerte
     * @param alertId
     * @returns any Alerte de test envoyée
     * @throws ApiError
     */
    public static postAlertsTest(
        alertId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/alerts/{alert_id}/test',
            path: {
                'alert_id': alertId,
            },
        });
    }
    /**
     * Mes notifications
     * @param read
     * @returns any Notifications avec unread_count
     * @throws ApiError
     */
    public static getNotifications(
        read?: boolean,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/notifications',
            query: {
                'read': read,
            },
        });
    }
    /**
     * Marquer toutes comme lues
     * @returns any Toutes marquées
     * @throws ApiError
     */
    public static postNotificationsMarkAllRead(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/notifications/mark-all-read',
        });
    }
    /**
     * Supprimer une notification
     * @param notifId
     * @returns any Notification supprimée
     * @throws ApiError
     */
    public static deleteNotifications(
        notifId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/notifications/{notif_id}',
            path: {
                'notif_id': notifId,
            },
        });
    }
    /**
     * Marquer comme lue
     * @param notifId
     * @returns any Notification marquée
     * @throws ApiError
     */
    public static patchNotificationsRead(
        notifId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/notifications/{notif_id}/read',
            path: {
                'notif_id': notifId,
            },
        });
    }
}
