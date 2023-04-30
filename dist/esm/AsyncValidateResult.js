import { AbstractAsyncValidateResult } from "./AbstractAsyncValidateResult";
export class AsyncValidateResult extends AbstractAsyncValidateResult {
    get valid() {
        return !this.errors;
    }
    get invalid() {
        return !this.valid;
    }
    constructor(data) {
        super();
        this.data = data;
    }
    mergeOneError(field, error) {
        if (!this.errors)
            this.errors = {};
        if (!this.errors[field])
            this.errors[field] = {};
        Object.assign(this.errors[field], error);
    }
    getError(errorCode, path) {
        if (!path)
            return null;
        const paths = path.split(/\/|\./).map((p) => p.trim());
        if (paths.length === 0)
            return null;
        const errors = paths.reduce((acc, _path) => {
            return acc[_path] ? acc[_path] : null;
        }, this.errors);
        return errors ? errors[errorCode] : null;
    }
    hasError(errorCode, path) {
        return !!this.getError(errorCode, path);
    }
}
