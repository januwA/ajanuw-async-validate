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
    required?: ValidateHandleArg;
    validators?: AsyncValidate | AsyncValidateHandle | AsyncValidateHandle[] | IValidateConfig;
    fail?: (errors: {
        value: any;
        errors: AnyObject;
    }) => void;
    [name: string]: any;
}
export interface IValidateConfig {
    [key: string]: null | AsyncValidateHandle | AsyncValidateHandle[] | AsyncValidateOptions;
}
export interface IOptions {
    checkAll?: boolean;
    fail?: ValidateFailHandle;
    ignore?: boolean;
}
export declare class AsyncValidate {
    readonly validateConfig: IValidateConfig;
    options: IOptions;
    static fail?: ValidateFailHandle;
    static firstError(errorFields: ValidateFailFileds): any;
    constructor(validateConfig: IValidateConfig, options?: IOptions);
    static mixin(handles: {
        [name: string]: (...args: any[]) => AsyncValidateHandle;
    }): void;
    private _eachValidators;
    private _fail;
    validate(data: AnyObject): Promise<boolean>;
    static required(msg: string): AsyncValidateHandle;
    static minLength(len: number, msg: string): AsyncValidateHandle;
    static maxLength(len: number, msg: string): AsyncValidateHandle;
    private static PHONE_EXP;
    static phone(msg: string): AsyncValidateHandle;
    static eql(data: any, msg: string): AsyncValidateHandle;
    static equal(data: any, msg: string): AsyncValidateHandle;
    static bool(msg: string): AsyncValidateHandle;
    private static EMAIL_EXP;
    static email(msg: string): AsyncValidateHandle;
    static max(max: number, msg: string): AsyncValidateHandle;
    static min(min: number, msg: string): AsyncValidateHandle;
    static hex(msg: string): AsyncValidateHandle;
    static number(msg: string): AsyncValidateHandle;
    static int(msg: string): AsyncValidateHandle;
    static float(msg: string): AsyncValidateHandle;
    static array(msg: string): AsyncValidateHandle;
    static object(msg: string): AsyncValidateHandle;
    static json(msg: string): AsyncValidateHandle;
    static regexp(msg: string): AsyncValidateHandle;
}
//# sourceMappingURL=async-validate.d.ts.map