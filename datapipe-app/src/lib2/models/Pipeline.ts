/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Pipeline = {
    created_at?: string;
    description?: string;
    id?: string;
    is_public?: boolean;
    last_run_at?: string;
    last_run_status?: Pipeline.last_run_status;
    name?: string;
    nodes_count?: number;
    status?: Pipeline.status;
    tags?: Array<string>;
    updated_at?: string;
    workspace_id?: string;
};
export namespace Pipeline {
    export enum last_run_status {
        SUCCESS = 'success',
        ERROR = 'error',
        RUNNING = 'running',
    }
    export enum status {
        ACTIVE = 'active',
        ARCHIVED = 'archived',
        DELETED = 'deleted',
    }
}

