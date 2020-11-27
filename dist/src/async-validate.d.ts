export interface ValidateData {
    [key: string]: any;
}
export interface AsyncValidateOption {
    [key: string]: AsyncValidateHandle[];
}
export interface AsyncValidateHandle {
    (input: any, data: ValidateData): string | undefined | Promise<string | undefined>;
}
export interface ValidateError {
    name: string;
    message: string;
}
export interface ValidateErrorHandle {
    (errorMessage: ValidateError): void;
}
export declare class AsyncValidate {
    readonly options: AsyncValidateOption;
    readonly validateErrorHandle?: ValidateErrorHandle | undefined;
    static validateErrorHandle?: ValidateErrorHandle;
    constructor(options: AsyncValidateOption, validateErrorHandle?: ValidateErrorHandle | undefined);
    validate(data: ValidateData): Promise<boolean>;
    static required(msg: string): AsyncValidateHandle;
    static minLength(len: number, msg: string): AsyncValidateHandle;
    static maxLength(len: number, msg: string): AsyncValidateHandle;
    private static PHONE_EXP;
    static phone(msg: string, exp?: RegExp): AsyncValidateHandle;
    static eql(data: any, msg: string): AsyncValidateHandle;
    static equal(data: any, msg: string): AsyncValidateHandle;
    static bool(msg: string): AsyncValidateHandle;
    private static EMAIL_EXP;
    static email(msg: string): AsyncValidateHandle;
    static max(max: number, msg: string): AsyncValidateHandle;
    static min(min: number, msg: string): AsyncValidateHandle;
}
//# sourceMappingURL=async-validate.d.ts.map