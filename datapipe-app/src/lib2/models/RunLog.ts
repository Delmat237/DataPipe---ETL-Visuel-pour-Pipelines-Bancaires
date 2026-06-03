/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RunLog = {
    id?: string;
    level?: RunLog.level;
    message?: string;
    node_id?: string;
    run_id?: string;
    timestamp?: string;
};
export namespace RunLog {
    export enum level {
        INFO = 'info',
        WARN = 'warn',
        ERROR = 'error',
    }
}

