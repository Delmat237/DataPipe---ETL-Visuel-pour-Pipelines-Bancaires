/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Webhook = {
    active?: boolean;
    created_at?: string;
    events?: Array<'run.success' | 'run.error' | 'run.started' | 'run.cancelled'>;
    id?: string;
    inbound_token?: string;
    pipeline_id?: string;
    url?: string;
};

