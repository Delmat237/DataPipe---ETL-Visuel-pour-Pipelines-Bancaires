/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Alert = {
    active?: boolean;
    channel?: Alert.channel;
    condition?: string;
    created_at?: string;
    id?: string;
    name?: string;
    pipeline_id?: string;
};
export namespace Alert {
    export enum channel {
        EMAIL = 'email',
        SLACK = 'slack',
        SMS = 'sms',
    }
}

