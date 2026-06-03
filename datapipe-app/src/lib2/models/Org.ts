/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Org = {
    created_at?: string;
    id?: string;
    members_count?: number;
    name?: string;
    plan?: Org.plan;
    slug?: string;
    storage_used_mb?: number;
};
export namespace Org {
    export enum plan {
        FREE = 'free',
        PRO = 'pro',
        ENTERPRISE = 'enterprise',
    }
}

