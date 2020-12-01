export interface AnyObject {
    [k: string]: any;
}
export interface ValidateData extends AnyObject {
}
export interface AsyncValidateHandle {
    (input: any, data: ValidateData): AnyObject | undefined | Promise<AnyObject | undefined>;
}
export declare type ValidateHandleArg = string | any[];
export interface ValidateFailFileds {
    [name: string]: {
        value: any;
        errors: AnyObject;
    };
}
export interface ValidateFailHandle {
    (errorFields: ValidateFailFileds): void;
}
//# sourceMappingURL=interface.d.ts.map