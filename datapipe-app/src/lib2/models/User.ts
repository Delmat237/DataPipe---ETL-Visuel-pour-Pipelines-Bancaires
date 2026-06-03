/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type User = {
    avatar_url?: string;
    created_at?: string;
    email?: string;
    id?: string;
    name?: string;
    orgs?: Array<{
        id?: string;
        name?: string;
        role?: 'viewer' | 'editor' | 'admin' | 'owner';
    }>;
    verified?: boolean;
};

