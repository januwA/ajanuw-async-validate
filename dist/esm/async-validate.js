function isSuccess(errorFileds) {
    return Object.keys(errorFileds).length === 0;
}
function isObject(data) {
    return Object.prototype.toString.call(data) === "[object Object]";
}
const VALIDATORS = "validators";
function isValidators(obj) {
    return obj.hasOwnProperty(VALIDATORS);
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
                const v = AsyncValidate[key](...arg);
                vs.push(v);
            }
            else {
                throw new Error(`[[ AsyncValidate ]] not set "${key}" validate.`);
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
            ignore: true,
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
    async _eachValidators(key, value, data, errorCallback) {
        if (this.validateConfig[key] !== null) {
            const validators = handleValidators(this.validateConfig[key]);
            for (const h of validators) {
                const error = await h(value, data);
                if (error)
                    errorCallback(error);
            }
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
    async validate(data) {
        const errorFileds = {};
        let success = true;
        for (const [key, value] of Object.entries(data)) {
            if (!this.validateConfig.hasOwnProperty(key)) {
                if (!this.options.ignore)
                    console.warn(`[[ AsyncValidate ]] "${key}" validate is not set.`);
                continue;
            }
            const keyValidate = this.validateConfig[key];
            if (keyValidate === null)
                continue;
            await this._eachValidators(key, value, data, (error) => {
                if (!errorFileds[key]) {
                    errorFileds[key] = {
                        value,
                        errors: {},
                    };
                }
                Object.assign(errorFileds[key].errors, error);
            });
            if (errorFileds.hasOwnProperty(key) &&
                keyValidate.hasOwnProperty("fail")) {
                keyValidate.fail(errorFileds[key]);
            }
            success = isSuccess(errorFileds);
            if (!success && !this.options.checkAll) {
                this._fail(errorFileds);
                break;
            }
            if (isValidators(keyValidate) && isObject(keyValidate.validators)) {
                keyValidate.validators = new AsyncValidate(keyValidate.validators, this.options);
            }
            if (isValidators(keyValidate) &&
                keyValidate.validators instanceof AsyncValidate) {
                const av = keyValidate.validators;
                if (!av.options.fail)
                    av.options.fail = this.options.fail;
                success = await av.validate(value);
                if (!success && !this.options.checkAll)
                    break;
            }
        }
        if (!success && this.options.checkAll)
            this._fail(errorFileds);
        return success;
    }
    static required(msg) {
        return (input) => {
            if (!input)
                return { required: msg };
        };
    }
    static minLength(len, msg) {
        return (input) => {
            if (input.length < parseFloat(len))
                return { minLength: msg };
        };
    }
    static maxLength(len, msg) {
        return (input) => {
            if (input.length > parseFloat(len))
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
}
AsyncValidate.PHONE_EXP = /^((13[0-9])|(14[0-9])|(15[0-9])|(16[0-9])|(17[0-9])|(18[0-9])|(19[0-9]))\d{8}$/;
AsyncValidate.EMAIL_EXP = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
