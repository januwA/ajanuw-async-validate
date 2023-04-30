import { AsyncValidateResult } from "./AsyncValidateResult";
import { AnyObject, AsyncValidateConfig } from "./interface";
import { AbstractAsyncValidate } from "./AbstractAsyncValidate";
export declare class AsyncValidate extends AbstractAsyncValidate {
    readonly config: AsyncValidateConfig;
    constructor(config: AsyncValidateConfig);
    private _validate;
    validate(data: AnyObject, checkAll?: boolean): Promise<AsyncValidateResult>;
}
//# sourceMappingURL=AsyncValidate.d.ts.map