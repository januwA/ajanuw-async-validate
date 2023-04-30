import { AsyncValidateResult } from "./AsyncValidateResult";
import { AbstractAsyncValidate } from "./AbstractAsyncValidate";
import { checkValue } from "./utils";
export class AsyncValidate extends AbstractAsyncValidate {
    constructor(config) {
        super();
        this.config = config;
    }
    async _validate(data, checkAll = false) {
        const result = new AsyncValidateResult(data);
        for (const [field, valueValidate] of Object.entries(this.config)) {
            if (!(field in data)) {
                throw new Error(`AsyncValidate Error: "${field}" not data`);
            }
            const value = data[field];
            if (valueValidate instanceof AbstractAsyncValidate) {
                const fieldResult = await valueValidate._validate(value, checkAll);
                if (fieldResult.invalid) {
                    result.mergeOneError(field, fieldResult.errors);
                }
            }
            else {
                const errors = await checkValue(valueValidate, value, data);
                errors.forEach((error) => result.mergeOneError(field, error));
            }
            if (result.invalid && !checkAll)
                break;
        }
        return result;
    }
    async validate(data, checkAll = false) {
        const result = await this._validate(data, checkAll);
        if (AsyncValidateResult.failHook && result.invalid) {
            AsyncValidateResult.failHook(result);
        }
        return result;
    }
}
