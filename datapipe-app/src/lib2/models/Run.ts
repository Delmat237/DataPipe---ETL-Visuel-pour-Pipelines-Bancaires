/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Run = {
    duration_ms?: number;
    error_message?: string;
    finished_at?: string;
    id?: string;
    pipeline_id?: string;
    started_at?: string;
    status?: Run.status;
    trigger?: Run.trigger;
};
export namespace Run {
    export enum status {
        PENDING = 'pending',
        RUNNING = 'running',
        SUCCESS = 'success',
        ERROR = 'error',
        CANCELLED = 'cancelled',
    }
    export enum trigger {
        MANUAL = 'manual',
        SCHEDULE = 'schedule',
        WEBHOOK = 'webhook',
        RETRY = 'retry',
    }
}

