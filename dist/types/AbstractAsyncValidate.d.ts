import { AsyncValidateResult } from "./AsyncValidateResult";
import { AnyObject } from "./interface";
export declare abstract class AbstractAsyncValidate {
    name: string;
    setName(name: string): void;
    abstract validate(data: AnyObject, checkAll: boolean): Promise<AsyncValidateResult>;
}
//# sourceMappingURL=AbstractAsyncValidate.d.ts.map