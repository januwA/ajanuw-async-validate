export interface AnyObject {
    [k: string]: any;
}
export declare type AsyncValidateResult = AnyObject | undefined | null;
export declare type AsyncValidatePromiseResult = Promise<AsyncValidateResult>;
export interface AsyncValidateHandle {
    (input: any, data: AnyObject): AsyncValidateResult | AsyncValidatePromiseResult;
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