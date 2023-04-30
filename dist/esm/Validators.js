import isEmail from "validator/lib/isEmail";
import isIP from "validator/lib/isIP";
import isJSON from "validator/lib/isJSON";
import isURL from "validator/lib/isURL";
import isMobilePhone from "validator/lib/isMobilePhone";
import { makeValidatorError } from "./utils";
export class Validators {
    static and(validators, msg) {
        return async (input, data) => {
            for await (const v of validators) {
                if (await v(input, data))
                    return makeValidatorError("and", msg);
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
            return makeValidatorError("or", msg);
        };
    }
    static required(msg) {
        return (input) => {
            if (!input)
                return makeValidatorError("required", msg);
        };
    }
    static len(size, msg) {
        return (input) => {
            if (!input.hasOwnProperty("length") || input.length !== size)
                return makeValidatorError("len", msg);
        };
    }
    static minLength(len, msg) {
        return (input) => {
            if (!input.hasOwnProperty("length") || input.length < len)
                return makeValidatorError("minLength", msg);
        };
    }
    static maxLength(len, msg) {
        return (input) => {
            if (!input.hasOwnProperty("length") || input.length > len)
                return makeValidatorError("maxLength", msg);
        };
    }
    static phone(msg, locale = "zh-CN") {
        return (input) => {
            if (!isMobilePhone(input, locale))
                return makeValidatorError("phone", msg);
        };
    }
    static bool(msg) {
        return (input) => {
            if (!(input === true || input === false))
                return makeValidatorError("bool", msg);
        };
    }
    static ipv4(msg) {
        return (input) => {
            if (!isIP(input, 4))
                return makeValidatorError("ipv4", msg);
        };
    }
    static ipv6(msg) {
        return (input) => {
            if (!isIP(input, 6))
                return makeValidatorError("ipv6", msg);
        };
    }
    static url(msg) {
        return (input) => {
            if (!isURL(input))
                return makeValidatorError("url", msg);
        };
    }
    static email(msg) {
        return (input) => {
            if (!isEmail(input))
                return makeValidatorError("email", msg);
        };
    }
    static max(max, msg) {
        return (input) => {
            if (!Number.isFinite(input) || input > max)
                return makeValidatorError("max", msg);
        };
    }
    static min(min, msg) {
        return (input) => {
            if (!Number.isFinite(input) || input < min)
                return makeValidatorError("min", msg);
        };
    }
    static hex(msg) {
        return (input) => {
            const err = makeValidatorError("hex", msg);
            if (typeof input !== "string")
                return err;
            input = input.replace(/^0x/i, "");
            input = input.replace(/h$/i, "");
            if (/[^0-9a-fA-F]/.test(input))
                return err;
        };
    }
    static number(msg) {
        return (input) => {
            if (!Number.isFinite(input))
                return makeValidatorError("number", msg);
        };
    }
    static int(msg) {
        return (input) => {
            if (!Number.isSafeInteger(input))
                return makeValidatorError("int", msg);
        };
    }
    static array(msg) {
        return (input) => {
            if (!Array.isArray(input))
                return makeValidatorError("array", msg);
        };
    }
    static object(msg) {
        return (input) => {
            if (Object.prototype.toString.call(input) !== "[object Object]")
                return makeValidatorError("object", msg);
        };
    }
    static json(msg) {
        return (input) => {
            if (!isJSON(input))
                return makeValidatorError("json", msg);
        };
    }
    static regexp(msg) {
        return (input) => {
            if (!(input instanceof RegExp))
                return makeValidatorError("regexp", msg);
        };
    }
    static string(msg) {
        return (input) => {
            if (typeof input !== "string")
                return makeValidatorError("string", msg);
        };
    }
}
