/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Edge } from '../models/Edge';
import type { Message } from '../models/Message';
import type { Node } from '../models/Node';
import type { NodeType } from '../models/NodeType';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NodesService {
    /**
     * Catalogue des types de nœuds
     * @param category
     * @returns any Types de nœuds groupés par catégorie
     * @throws ApiError
     */
    public static getNodeTypes(
        category?: string,
    ): CancelablePromise<{
        by_category?: any;
        node_types?: Array<NodeType>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/node-types',
            query: {
                'category': category,
            },
        });
    }
    /**
     * Détail d'un type de nœud
     * @param typeSlug
     * @returns NodeType Type de nœud
     * @throws ApiError
     */
    public static getNodeTypes1(
        typeSlug: string,
    ): CancelablePromise<NodeType> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/node-types/{type_slug}',
            path: {
                'type_slug': typeSlug,
            },
        });
    }
    /**
     * JSON Schema de la config d'un type de nœud
     * @param typeSlug
     * @returns any JSON Schema de la configuration
     * @throws ApiError
     */
    public static getNodeTypesSchema(
        typeSlug: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/node-types/{type_slug}/schema',
            path: {
                'type_slug': typeSlug,
            },
        });
    }
    /**
     * Lister les arêtes
     * @param pipelineId
     * @returns any Arêtes
     * @throws ApiError
     */
    public static getPipelinesEdges(
        pipelineId: string,
    ): CancelablePromise<{
        edges?: Array<Edge>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/edges',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Créer une arête
     * @param pipelineId
     * @param body
     * @returns Edge Arête créée
     * @throws ApiError
     */
    public static postPipelinesEdges(
        pipelineId: string,
        body: {
            source: string;
            sourceHandle?: string;
            target: string;
            targetHandle?: string;
        },
    ): CancelablePromise<Edge> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/edges',
            path: {
                'pipeline_id': pipelineId,
            },
            body: body,
        });
    }
    /**
     * Valider le graphe (cycles, nœuds manquants)
     * @param pipelineId
     * @returns any Résultat de validation
     * @throws ApiError
     */
    public static postPipelinesEdgesValidate(
        pipelineId: string,
    ): CancelablePromise<{
        errors?: Array<any>;
        valid?: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/edges/validate',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Supprimer une arête
     * @param pipelineId
     * @param edgeId
     * @returns any Arête supprimée
     * @throws ApiError
     */
    public static deletePipelinesEdges(
        pipelineId: string,
        edgeId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pipelines/{pipeline_id}/edges/{edge_id}',
            path: {
                'pipeline_id': pipelineId,
                'edge_id': edgeId,
            },
        });
    }
    /**
     * Lister les nœuds
     * @param pipelineId
     * @returns any Nœuds
     * @throws ApiError
     */
    public static getPipelinesNodes(
        pipelineId: string,
    ): CancelablePromise<{
        nodes?: Array<Node>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/nodes',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Créer un nœud
     * @param pipelineId
     * @param body
     * @returns Node Nœud créé
     * @throws ApiError
     */
    public static postPipelinesNodes(
        pipelineId: string,
        body: {
            config?: any;
            label?: string;
            position?: {
                'x'?: number;
                'y'?: number;
            };
            type: string;
        },
    ): CancelablePromise<Node> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/nodes',
            path: {
                'pipeline_id': pipelineId,
            },
            body: body,
        });
    }
    /**
     * Créer plusieurs nœuds d'un coup
     * @param pipelineId
     * @param body
     * @returns any Nœuds créés
     * @throws ApiError
     */
    public static postPipelinesNodesBulk(
        pipelineId: string,
        body: {
            nodes: Array<{
                config?: any;
                label?: string;
                position?: any;
                type?: string;
            }>;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/nodes/bulk',
            path: {
                'pipeline_id': pipelineId,
            },
            body: body,
        });
    }
    /**
     * Supprimer un nœud (et ses arêtes)
     * @param pipelineId
     * @param nodeId
     * @returns Message Nœud supprimé
     * @throws ApiError
     */
    public static deletePipelinesNodes(
        pipelineId: string,
        nodeId: string,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pipelines/{pipeline_id}/nodes/{node_id}',
            path: {
                'pipeline_id': pipelineId,
                'node_id': nodeId,
            },
        });
    }
    /**
     * Détail d'un nœud
     * @param pipelineId
     * @param nodeId
     * @returns Node Nœud
     * @throws ApiError
     */
    public static getPipelinesNodes1(
        pipelineId: string,
        nodeId: string,
    ): CancelablePromise<Node> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/nodes/{node_id}',
            path: {
                'pipeline_id': pipelineId,
                'node_id': nodeId,
            },
        });
    }
    /**
     * Mettre à jour un nœud
     * @param pipelineId
     * @param nodeId
     * @param body
     * @returns Node Nœud mis à jour
     * @throws ApiError
     */
    public static patchPipelinesNodes(
        pipelineId: string,
        nodeId: string,
        body?: {
            config?: any;
            label?: string;
            position?: any;
        },
    ): CancelablePromise<Node> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pipelines/{pipeline_id}/nodes/{node_id}',
            path: {
                'pipeline_id': pipelineId,
                'node_id': nodeId,
            },
            body: body,
        });
    }
    /**
     * Remplacer un nœud
     * @param pipelineId
     * @param nodeId
     * @param body
     * @returns any Nœud mis à jour
     * @throws ApiError
     */
    public static putPipelinesNodes(
        pipelineId: string,
        nodeId: string,
        body: Node,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/pipelines/{pipeline_id}/nodes/{node_id}',
            path: {
                'pipeline_id': pipelineId,
                'node_id': nodeId,
            },
            body: body,
        });
    }
    /**
     * Épingler des données sur un nœud (feature n8n)
     * @param pipelineId
     * @param nodeId
     * @param body
     * @returns any Données épinglées
     * @throws ApiError
     */
    public static postPipelinesNodesPinData(
        pipelineId: string,
        nodeId: string,
        body: {
            data: any[];
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/nodes/{node_id}/pin-data',
            path: {
                'pipeline_id': pipelineId,
                'node_id': nodeId,
            },
            body: body,
        });
    }
    /**
     * Supprimer les données épinglées
     * @param pipelineId
     * @param nodeId
     * @returns any Données désépinglées
     * @throws ApiError
     */
    public static deletePipelinesNodesPinnedData(
        pipelineId: string,
        nodeId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pipelines/{pipeline_id}/nodes/{node_id}/pinned-data',
            path: {
                'pipeline_id': pipelineId,
                'node_id': nodeId,
            },
        });
    }
    /**
     * Lire les données épinglées
     * @param pipelineId
     * @param nodeId
     * @returns any Données épinglées
     * @throws ApiError
     */
    public static getPipelinesNodesPinnedData(
        pipelineId: string,
        nodeId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/nodes/{node_id}/pinned-data',
            path: {
                'pipeline_id': pipelineId,
                'node_id': nodeId,
            },
            errors: {
                404: `Aucune donnée épinglée`,
            },
        });
    }
    /**
     * Données de test d'un nœud (pinned ou mock)
     * @param pipelineId
     * @param nodeId
     * @returns any Données de test
     * @throws ApiError
     */
    public static getPipelinesNodesTestData(
        pipelineId: string,
        nodeId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/nodes/{node_id}/test-data',
            path: {
                'pipeline_id': pipelineId,
                'node_id': nodeId,
            },
        });
    }
}
