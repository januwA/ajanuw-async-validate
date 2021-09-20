export interface AnyObject {
    [k: string]: any;
}
export declare type AsyncValidateResult = AnyObject | undefined | null;
export declare type AsyncValidatePromiseResult = Promise<AsyncValidateResult>;
export interface AsyncValidateHandle {
    (input: any, data: AnyObject): AsyncValidateResult | AsyncValidatePromiseResult;
}
export declare type ValidateHandleArg = string | any[];
export interface ValidateFailFileds<T> {
    [name: string]: {
        value: any;
        data: T;
        errors: AnyObject;
    };
}
export interface ValidateFailHandle<T> {
    (errorFields: ValidateFailFileds<T>): void;
}
//# sourceMappingURL=interface.d.ts.map