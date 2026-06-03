/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Message } from '../models/Message';
import type { Pagination } from '../models/Pagination';
import type { Pipeline } from '../models/Pipeline';
import type { PipelineTemplate } from '../models/PipelineTemplate';
import type { PipelineVersion } from '../models/PipelineVersion';
import type { PipelineWithGraph } from '../models/PipelineWithGraph';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PipelinesService {
    /**
     * Lister les pipelines
     * @param workspaceId
     * @param page
     * @param perPage
     * @param search
     * @param status
     * @param sort
     * @returns any Pipelines paginés
     * @throws ApiError
     */
    public static getPipelines(
        workspaceId: string,
        page: number = 1,
        perPage: number = 20,
        search?: string,
        status?: 'active' | 'archived',
        sort?: 'name' | 'updated_at' | 'last_run_at',
    ): CancelablePromise<{
        data?: Array<Pipeline>;
        pagination?: Pagination;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines',
            query: {
                'workspace_id': workspaceId,
                'page': page,
                'per_page': perPage,
                'search': search,
                'status': status,
                'sort': sort,
            },
        });
    }
    /**
     * Créer un pipeline
     * @param body
     * @returns PipelineWithGraph Pipeline créé
     * @throws ApiError
     */
    public static postPipelines(
        body: {
            description?: string;
            name: string;
            tags?: Array<string>;
            workspace_id: string;
        },
    ): CancelablePromise<PipelineWithGraph> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines',
            body: body,
        });
    }
    /**
     * Importer un pipeline (JSON/YAML)
     * @param body
     * @returns PipelineWithGraph Pipeline importé
     * @throws ApiError
     */
    public static postPipelinesImport(
        body: {
            /**
             * Définition du pipeline exporté
             */
            definition: any;
            workspace_id: string;
        },
    ): CancelablePromise<PipelineWithGraph> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/import',
            body: body,
        });
    }
    /**
     * Fusionner deux pipelines
     * @param body
     * @returns any Pipelines fusionnés
     * @throws ApiError
     */
    public static postPipelinesMerge(
        body: {
            offset_x?: number;
            source_id: string;
            target_id: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/merge',
            body: body,
        });
    }
    /**
     * Lister les templates
     * @param category
     * @returns any Templates
     * @throws ApiError
     */
    public static getPipelinesTemplates(
        category?: string,
    ): CancelablePromise<{
        templates?: Array<PipelineTemplate>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/templates',
            query: {
                'category': category,
            },
        });
    }
    /**
     * Détail d'un template
     * @param templateId
     * @returns any Template avec nodes et edges
     * @throws ApiError
     */
    public static getPipelinesTemplates1(
        templateId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/templates/{template_id}',
            path: {
                'template_id': templateId,
            },
        });
    }
    /**
     * Créer un pipeline depuis un template
     * @param templateId
     * @param body
     * @returns PipelineWithGraph Pipeline créé depuis le template
     * @throws ApiError
     */
    public static postPipelinesTemplatesInstantiate(
        templateId: string,
        body: {
            name?: string;
            workspace_id: string;
        },
    ): CancelablePromise<PipelineWithGraph> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/templates/{template_id}/instantiate',
            path: {
                'template_id': templateId,
            },
            body: body,
        });
    }
    /**
     * Supprimer un pipeline
     * @param pipelineId
     * @returns Message Pipeline supprimé
     * @throws ApiError
     */
    public static deletePipelines(
        pipelineId: string,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pipelines/{pipeline_id}',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Charger un pipeline complet (avec nodes + edges)
     * @param pipelineId
     * @returns PipelineWithGraph Pipeline
     * @throws ApiError
     */
    public static getPipelines1(
        pipelineId: string,
    ): CancelablePromise<PipelineWithGraph> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}',
            path: {
                'pipeline_id': pipelineId,
            },
            errors: {
                404: `Pipeline introuvable`,
            },
        });
    }
    /**
     * Mettre à jour partiellement un pipeline
     * @param pipelineId
     * @param body
     * @returns Pipeline Pipeline mis à jour
     * @throws ApiError
     */
    public static patchPipelines(
        pipelineId: string,
        body?: {
            description?: string;
            name?: string;
            tags?: Array<string>;
        },
    ): CancelablePromise<Pipeline> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pipelines/{pipeline_id}',
            path: {
                'pipeline_id': pipelineId,
            },
            body: body,
        });
    }
    /**
     * Remplacer un pipeline
     * @param pipelineId
     * @param body
     * @returns Pipeline Pipeline mis à jour
     * @throws ApiError
     */
    public static putPipelines(
        pipelineId: string,
        body: {
            description?: string;
            name: string;
            tags?: Array<string>;
        },
    ): CancelablePromise<Pipeline> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/pipelines/{pipeline_id}',
            path: {
                'pipeline_id': pipelineId,
            },
            body: body,
        });
    }
    /**
     * Archiver un pipeline
     * @param pipelineId
     * @returns any Pipeline archivé
     * @throws ApiError
     */
    public static postPipelinesArchive(
        pipelineId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/archive',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Diff entre deux versions
     * @param pipelineId
     * @param versionA
     * @param versionB
     * @returns any Différences entre les deux versions
     * @throws ApiError
     */
    public static getPipelinesDiff(
        pipelineId: string,
        versionA: string,
        versionB: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/diff',
            path: {
                'pipeline_id': pipelineId,
            },
            query: {
                'version_a': versionA,
                'version_b': versionB,
            },
        });
    }
    /**
     * Dupliquer un pipeline
     * @param pipelineId
     * @param body
     * @returns PipelineWithGraph Pipeline dupliqué
     * @throws ApiError
     */
    public static postPipelinesDuplicate(
        pipelineId: string,
        body?: {
            name?: string;
        },
    ): CancelablePromise<PipelineWithGraph> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/duplicate',
            path: {
                'pipeline_id': pipelineId,
            },
            body: body,
        });
    }
    /**
     * Exporter un pipeline
     * @param pipelineId
     * @param format
     * @returns any Définition exportée (JSON ou YAML)
     * @throws ApiError
     */
    public static getPipelinesExport(
        pipelineId: string,
        format: 'json' | 'yaml' = 'json',
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/export',
            path: {
                'pipeline_id': pipelineId,
            },
            query: {
                'format': format,
            },
        });
    }
    /**
     * Rendre un pipeline public
     * @param pipelineId
     * @returns any Pipeline publié
     * @throws ApiError
     */
    public static postPipelinesPublish(
        pipelineId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/publish',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Restaurer un pipeline archivé
     * @param pipelineId
     * @returns any Pipeline restauré
     * @throws ApiError
     */
    public static postPipelinesRestore(
        pipelineId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/restore',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Rendre un pipeline privé
     * @param pipelineId
     * @returns any Pipeline dépublié
     * @throws ApiError
     */
    public static postPipelinesUnpublish(
        pipelineId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/unpublish',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Lister les versions
     * @param pipelineId
     * @returns any Versions
     * @throws ApiError
     */
    public static getPipelinesVersions(
        pipelineId: string,
    ): CancelablePromise<{
        versions?: Array<PipelineVersion>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/versions',
            path: {
                'pipeline_id': pipelineId,
            },
        });
    }
    /**
     * Créer un snapshot manuel
     * @param pipelineId
     * @param body
     * @returns PipelineVersion Snapshot créé
     * @throws ApiError
     */
    public static postPipelinesVersionsSnapshot(
        pipelineId: string,
        body?: {
            label?: string;
        },
    ): CancelablePromise<PipelineVersion> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/versions/snapshot',
            path: {
                'pipeline_id': pipelineId,
            },
            body: body,
        });
    }
    /**
     * Détail d'une version
     * @param pipelineId
     * @param versionId
     * @returns any Version avec snapshot complet
     * @throws ApiError
     */
    public static getPipelinesVersions1(
        pipelineId: string,
        versionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pipelines/{pipeline_id}/versions/{version_id}',
            path: {
                'pipeline_id': pipelineId,
                'version_id': versionId,
            },
        });
    }
    /**
     * Restaurer une version
     * @param pipelineId
     * @param versionId
     * @returns any Pipeline restauré à cette version
     * @throws ApiError
     */
    public static postPipelinesVersionsRestore(
        pipelineId: string,
        versionId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pipelines/{pipeline_id}/versions/{version_id}/restore',
            path: {
                'pipeline_id': pipelineId,
                'version_id': versionId,
            },
        });
    }
}
