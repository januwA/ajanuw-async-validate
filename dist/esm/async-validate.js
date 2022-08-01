const VALIDATORS = "validators";
function isSuccess(errorFileds) {
    return Object.keys(errorFileds).length === 0;
}
function isObject(data) {
    return Object.prototype.toString.call(data) === "[object Object]";
}
function hasValidators(obj) {
    return obj.hasOwnProperty("validators");
}
function handleValidators(validators) {
    if (!validators)
        return [];
    if (Array.isArray(validators))
        return validators;
    if (typeof validators === "function")
        return [validators];
    if (isObject(validators)) {
        let vs = [];
        for (const key in validators) {
            if ([VALIDATORS, "fail"].includes(key))
                continue;
            if (AsyncValidate.hasOwnProperty(key)) {
                let arg = validators[key];
                if (!Array.isArray(arg))
                    arg = [arg];
                vs.push(AsyncValidate[key](...arg));
            }
            else {
                throw new Error(`[[ AsyncValidate ]] not "${key}" validate.`);
            }
        }
        if (!(validators.validators instanceof AsyncValidate) &&
            !isObject(validators.validators)) {
            vs = vs.concat(handleValidators(validators.validators));
        }
        return vs;
    }
    return [];
}
export class AsyncValidate {
    constructor(validateConfig, options) {
        this.validateConfig = validateConfig;
        this.options = Object.assign({
            checkAll: false,
        }, options);
    }
    static firstError(errorFields) {
        if (errorFields && Object.keys(errorFields).length) {
            return Object.values(errorFields[Object.keys(errorFields)[0]].errors)[0];
        }
    }
    static mixin(handles) {
        Object.keys(handles)
            .filter((k) => {
            if (!AsyncValidate.hasOwnProperty(k))
                return k;
        })
            .forEach((k) => (AsyncValidate[k] = handles[k]));
    }
    async checkValue(keyValidate, value, data, errorCallback) {
        for (const h of handleValidators(keyValidate)) {
            const error = await h(value, data);
            if (error)
                errorCallback(error);
        }
    }
    _fail(errorFileds) {
        if (isSuccess(errorFileds))
            return;
        if (this.options.fail)
            this.options.fail(errorFileds);
        else if (AsyncValidate.fail)
            AsyncValidate.fail(errorFileds);
    }
    async validate(data, handleFail) {
        const errorFileds = {};
        let success = true;
        data ?? (data = {});
        for (const [key, keyValidate] of Object.entries(this.validateConfig)) {
            if (!keyValidate)
                continue;
            if (!(key in data)) {
                throw new Error(`AsyncValidate Error: 没有 ${key} 数据!`);
            }
            const value = data[key];
            await this.checkValue(keyValidate, value, data, (error) => {
                errorFileds[key] ?? (errorFileds[key] = {
                    value,
                    data,
                    errors: {},
                });
                Object.assign(errorFileds[key].errors, error);
            });
            if (key in errorFileds && "fail" in keyValidate) {
                keyValidate.fail?.(errorFileds[key]);
            }
            success = isSuccess(errorFileds);
            if (!success && !this.options.checkAll)
                break;
            if (hasValidators(keyValidate) && isObject(keyValidate.validators)) {
                const av = new AsyncValidate(keyValidate.validators, this.options);
                success = await av.validate(value);
                if (!success && !this.options.checkAll)
                    break;
            }
        }
        if (!success) {
            this._fail(errorFileds);
            handleFail?.(errorFileds);
        }
        return success;
    }
    static and(validators, msg) {
        return async (input, data) => {
            for await (const v of validators) {
                if (await v(input, data))
                    return { and: msg };
            }
            return null;
        };
    }
    static or(validators, msg) {
        return async (input, data) => {
            let r;
            for await (const v of validators) {
                r = await v(input, data);
                if (!r)
                    return null;
            }
            return { or: msg };
        };
    }
    static required(msg) {
        return (input) => {
            if (!input)
                return { required: msg };
        };
    }
    static len(size, msg) {
        return (input) => {
            if (!input.hasOwnProperty("length") || input.length !== size)
                return { len: msg };
        };
    }
    static minLength(len, msg) {
        return (input) => {
            if (!input.hasOwnProperty("length") ||
                input.length < parseFloat(len))
                return { minLength: msg };
        };
    }
    static maxLength(len, msg) {
        return (input) => {
            if (!input.hasOwnProperty("length") ||
                input.length > parseFloat(len))
                return { maxLength: msg };
        };
    }
    static phone(msg) {
        return (input) => {
            if (typeof input === "string" && !input.match(AsyncValidate.PHONE_EXP)) {
                return { phone: msg };
            }
        };
    }
    static eql(data, msg) {
        return (input) => {
            if (input !== data)
                return { eql: msg };
        };
    }
    static equal(data, msg) {
        return (input) => {
            if (input != data)
                return { equal: msg };
        };
    }
    static bool(msg) {
        return (input) => {
            if (!(input === true || input === false))
                return { bool: msg };
        };
    }
    static email(msg) {
        return (input) => {
            if (!input.match(AsyncValidate.EMAIL_EXP))
                return { email: msg };
        };
    }
    static max(max, msg) {
        return (input) => {
            if (!isNaN(input) && input > parseFloat(max))
                return { max: msg };
        };
    }
    static min(min, msg) {
        return (input) => {
            if (!isNaN(input) && input < parseFloat(min))
                return { min: msg };
        };
    }
    static hex(msg) {
        return (input) => {
            input = input.replace(/^0x/i, "");
            input = input.replace(/h$/i, "");
            if (/[^0-9a-fA-F]/.test(input))
                return { hex: msg };
        };
    }
    static number(msg) {
        return (input) => {
            if (!Number.isFinite(input) || typeof input !== "number")
                return { number: msg };
        };
    }
    static int(msg) {
        return (input, data) => {
            if (this.number("")(input, data) || !Number.isSafeInteger(input))
                return { int: msg };
        };
    }
    static float(msg) {
        return (input, data) => {
            if (this.number("")(input, data) || Number.isInteger(input))
                return { float: msg };
        };
    }
    static array(msg) {
        return (input) => {
            if (!Array.isArray(input))
                return { array: msg };
        };
    }
    static object(msg) {
        return (input) => {
            if (Object.prototype.toString.call(input) !== "[object Object]")
                return { object: msg };
        };
    }
    static json(msg) {
        return (input) => {
            try {
                JSON.parse(input);
            }
            catch (error) {
                return { json: msg };
            }
        };
    }
    static regexp(msg) {
        return (input) => {
            if (!(input instanceof RegExp))
                return { regexp: msg };
        };
    }
    static string(msg) {
        return (input) => {
            if (typeof input === "string")
                return null;
            return { string: msg };
        };
    }
}
AsyncValidate.PHONE_EXP = /^((13[0-9])|(14[0-9])|(15[0-9])|(16[0-9])|(17[0-9])|(18[0-9])|(19[0-9]))\d{8}$/;
AsyncValidate.EMAIL_EXP = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
