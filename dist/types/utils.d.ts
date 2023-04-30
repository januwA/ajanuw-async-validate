import { AbstractAsyncValidateResult } from "./AbstractAsyncValidateResult";
import { AnyObject, AsyncValidateHandle, AsyncValidateOptionValue } from "./interface";
export declare function firstErrorMsg(result: AbstractAsyncValidateResult): any;
export declare function handleValidators(validators?: AsyncValidateOptionValue): AsyncValidateHandle[];
export declare function checkValue(keyValidate: AsyncValidateOptionValue, value: any, data: AnyObject): Promise<AnyObject[]>;
export declare function makeValidatorError(errCode: string, msg?: string): {
    [x: string]: string | boolean;
};
//# sourceMappingURL=utils.d.ts.map