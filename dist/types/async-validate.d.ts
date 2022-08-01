import { AnyObject, AsyncValidateHandle, ValidateFailFileds, ValidateFailHandle, ValidateHandleArg } from "./interface";
export interface AsyncValidateOptions {
    string?: ValidateHandleArg;
    number?: ValidateHandleArg;
    bool?: ValidateHandleArg;
    float?: ValidateHandleArg;
    int?: ValidateHandleArg;
    object?: ValidateHandleArg;
    array?: ValidateHandleArg;
    json?: ValidateHandleArg;
    email?: ValidateHandleArg;
    hex?: ValidateHandleArg;
    regexp?: ValidateHandleArg;
    or?: ValidateHandleArg;
    and?: ValidateHandleArg;
    required?: ValidateHandleArg;
    validators?: AsyncValidateHandle | AsyncValidateHandle[] | IValidateConfig;
    fail?: (errors: {
        value: any;
        errors: AnyObject;
    }) => void;
    [name: string]: any;
}
declare type AsyncValidateCheck = AsyncValidateHandle | AsyncValidateHandle[] | AsyncValidateOptions;
export interface IValidateConfig {
    [key: string]: null | AsyncValidateCheck;
}
export interface IOptions<T> {
    checkAll?: boolean;
    fail?: ValidateFailHandle<T>;
}
export declare class AsyncValidate<T extends IValidateConfig, D = {
    [key in keyof T]?: any;
}> {
    readonly validateConfig: T;
    options: IOptions<D>;
    static fail?: ValidateFailHandle<any>;
    static firstError(errorFields: ValidateFailFileds<any>): any;
    constructor(validateConfig: T, options?: IOptions<D>);
    static mixin(handles: {
        [name: string]: (...args: any[]) => AsyncValidateHandle;
    }): void;
    private checkValue;
    private _fail;
    validate(data: D, handleFail?: (errorFileds: ValidateFailFileds<D>) => void): Promise<boolean>;
    static and(validators: AsyncValidateHandle[], msg?: string): (input: any, data: any) => Promise<{
        and: string | undefined;
    } | null>;
    static or(validators: AsyncValidateHandle[], msg?: string): (input: any, data: any) => Promise<{
        or: string | undefined;
    } | null>;
    static required(msg?: string): AsyncValidateHandle;
    static len(size: number, msg?: string): AsyncValidateHandle;
    static minLength(len: number, msg?: string): AsyncValidateHandle;
    static maxLength(len: number, msg?: string): AsyncValidateHandle;
    private static PHONE_EXP;
    static phone(msg?: string): AsyncValidateHandle;
    static eql(data: any, msg?: string): AsyncValidateHandle;
    static equal(data: any, msg?: string): AsyncValidateHandle;
    static bool(msg?: string): AsyncValidateHandle;
    private static EMAIL_EXP;
    static email(msg?: string): AsyncValidateHandle;
    static max(max: number, msg?: string): AsyncValidateHandle;
    static min(min: number, msg?: string): AsyncValidateHandle;
    static hex(msg?: string): AsyncValidateHandle;
    static number(msg?: string): AsyncValidateHandle;
    static int(msg?: string): AsyncValidateHandle;
    static float(msg?: string): AsyncValidateHandle;
    static array(msg?: string): AsyncValidateHandle;
    static object(msg?: string): AsyncValidateHandle;
    static json(msg?: string): AsyncValidateHandle;
    static regexp(msg?: string): AsyncValidateHandle;
    static string(msg?: string): AsyncValidateHandle;
}
export {};
//# sourceMappingURL=async-validate.d.ts.map