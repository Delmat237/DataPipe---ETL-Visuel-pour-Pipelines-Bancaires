/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NodeType = {
    category?: NodeType.category;
    color?: string;
    description?: string;
    icon?: string;
    inputs?: number;
    name?: string;
    outputs?: number;
    slug?: string;
};
export namespace NodeType {
    export enum category {
        INPUT = 'Input',
        TRANSFORM = 'Transform',
        OUTPUT = 'Output',
        AI = 'AI',
        CONTROL = 'Control',
        TRIGGER = 'Trigger',
    }
}

