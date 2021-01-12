export interface AnyObject {
    [k: string]: any;
}
export interface AsyncValidateHandle {
    (input: any, data: AnyObject): AnyObject | undefined | Promise<AnyObject | undefined>;
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
