import { AbstractAsyncValidateResult } from "./AbstractAsyncValidateResult";
import { AnyObject } from "./interface";
export declare class AsyncValidateResult extends AbstractAsyncValidateResult {
    readonly data: AnyObject;
    static failHook?: (result: AsyncValidateResult) => void;
    get valid(): boolean;
    get invalid(): boolean;
    constructor(data: AnyObject);
    mergeOneError(field: string, error: {
        [field: string]: AnyObject;
    }): void;
    getError(errorCode: string, path: string): string | null;
    hasError(errorCode: string, path: string): boolean;
}
//# sourceMappingURL=AsyncValidateResult.d.ts.map