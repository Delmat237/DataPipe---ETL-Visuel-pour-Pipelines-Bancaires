/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Datasource = {
    active?: boolean;
    config?: any;
    created_at?: string;
    id?: string;
    last_synced_at?: string;
    name?: string;
    sync_status?: Datasource.sync_status;
    type?: Datasource.type;
    workspace_id?: string;
};
export namespace Datasource {
    export enum sync_status {
        IDLE = 'idle',
        SYNCING = 'syncing',
        ERROR = 'error',
    }
    export enum type {
        POSTGRESQL = 'postgresql',
        MYSQL = 'mysql',
        SQLITE = 'sqlite',
        MONGODB = 'mongodb',
        API = 'api',
        S3 = 's3',
    }
}

