/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AiService {
    /**
     * Chat avec DataPipe Assistant
     * @param body
     * @returns any Réponse de l'assistant
     * @throws ApiError
     */
    public static postAiChat(
        body: {
            message: string;
            session_id?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/chat',
            body: body,
        });
    }
    /**
     * Historique d'une session de chat
     * @param sessionId
     * @returns any Messages de la session
     * @throws ApiError
     */
    public static getAiChatHistory(
        sessionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ai/chat/{session_id}/history',
            path: {
                'session_id': sessionId,
            },
        });
    }
    /**
     * Classifier des lignes dans des catégories
     * @param body
     * @returns any Résultats de classification
     * @throws ApiError
     */
    public static postAiClassify(
        body: {
            categories: Array<string>;
            data: any[];
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/classify',
            body: body,
        });
    }
    /**
     * Nettoyer automatiquement un dataset
     * @param body
     * @returns any Dataset nettoyé avec rapport
     * @throws ApiError
     */
    public static postAiCleanData(
        body: {
            data: any[];
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/clean-data',
            body: body,
        });
    }
    /**
     * Détecter les anomalies dans un dataset
     * @param body
     * @returns any Anomalies détectées avec z-score
     * @throws ApiError
     */
    public static postAiDetectAnomalies(
        body: {
            amount_field?: string;
            data: Array<any>;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/detect-anomalies',
            body: body,
        });
    }
    /**
     * Batch anomaly detection
     * @returns any
     * @throws ApiError
     */
    public static getAiDetectAnomaliesBatch(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ai/detect-anomalies-batch',
        });
    }
    /**
     * Générer des embeddings vectoriels
     * @param body
     * @returns any Vecteurs d'embeddings
     * @throws ApiError
     */
    public static postAiEmbed(
        body: {
            texts: Array<string>;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/embed',
            body: body,
        });
    }
    /**
     * Expliquer ce que fait un nœud
     * @param body
     * @returns any Explication en langage naturel
     * @throws ApiError
     */
    public static postAiExplainNode(
        body: {
            config?: any;
            node_type: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/explain-node',
            body: body,
        });
    }
    /**
     * Extraire des entités (montants, dates, noms)
     * @param body
     * @returns any Entités extraites
     * @throws ApiError
     */
    public static postAiExtractEntities(
        body: {
            texts: Array<string>;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/extract-entities',
            body: body,
        });
    }
    /**
     * Générer un pipeline React Flow complet depuis un prompt
     * @param body
     * @returns any Pipeline React Flow (nodes + edges) généré
     * @throws ApiError
     */
    public static postAiGeneratePipeline(
        body: {
            prompt: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/generate-pipeline',
            body: body,
        });
    }
    /**
     * Inférer un schema JSON depuis des données
     * @param body
     * @returns any Schema JSON inféré
     * @throws ApiError
     */
    public static postAiGenerateSchema(
        body: {
            sample_data: any[];
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/generate-schema',
            body: body,
        });
    }
    /**
     * Générer une requête SQL depuis une description naturelle
     * @param body
     * @returns any Requête SQL générée avec score de confiance
     * @throws ApiError
     */
    public static postAiGenerateTransform(
        body: {
            context?: {
                columns?: Array<string>;
            };
            description: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/generate-transform',
            body: body,
        });
    }
    /**
     * Modèles IA disponibles
     * @returns any Liste des modèles
     * @throws ApiError
     */
    public static getAiModels(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ai/models',
        });
    }
    /**
     * Suggérer une structure de pipeline depuis un objectif
     * @param body
     * @returns any Structure de pipeline suggérée
     * @throws ApiError
     */
    public static postAiSuggestPipeline(
        body: {
            goal: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/suggest-pipeline',
            body: body,
        });
    }
    /**
     * Utilisation des tokens IA
     * @returns any Tokens utilisés / limit
     * @throws ApiError
     */
    public static getAiUsage(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ai/usage',
        });
    }
}
