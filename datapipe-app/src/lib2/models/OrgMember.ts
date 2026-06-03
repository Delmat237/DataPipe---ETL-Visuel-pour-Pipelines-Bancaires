/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type OrgMember = {
    email?: string;
    joined_at?: string;
    name?: string;
    role?: OrgMember.role;
    user_id?: string;
};
export namespace OrgMember {
    export enum role {
        VIEWER = 'viewer',
        EDITOR = 'editor',
        ADMIN = 'admin',
        OWNER = 'owner',
    }
}

