import isEmail from "validator/lib/isEmail";
import isIP from "validator/lib/isIP";
import isJSON from "validator/lib/isJSON";
import isURL from "validator/lib/isURL";
import isMobilePhone, { MobilePhoneLocale } from "validator/lib/isMobilePhone";

import { AsyncValidateHandle } from "./interface";
import { makeValidatorError } from "./utils";

export class Validators {
  /**
   *
   * @param validators 测试表达式
   * @param msg 错误消息
   * @returns
   */
  static and(validators: AsyncValidateHandle[], msg?: string) {
    return async (input: any, data: any) => {
      for await (const v of validators) {
        if (await v(input, data)) return makeValidatorError("and", msg);
      }

      return null;
    };
  }

  /**
   *
   * @param validators 测试表达式
   * @param msg 错误消息
   * @returns
   */
  static or(validators: AsyncValidateHandle[], msg?: string) {
    return async (input: any, data: any) => {
      let r: any;
      for await (const v of validators) {
        r = await v(input, data);
        if (!r) return null;
      }

      return makeValidatorError("or", msg);
    };
  }

  // 必填
  static required(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!input) return makeValidatorError("required", msg);
    };
  }

  // length 长度判断
  static len(size: number, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!input.hasOwnProperty("length") || input.length !== size)
        return makeValidatorError("len", msg);
    };
  }

  // 最小长度
  static minLength(len: number, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!input.hasOwnProperty("length") || input.length < len)
        return makeValidatorError("minLength", msg);
    };
  }

  // 最大长度
  static maxLength(len: number, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!input.hasOwnProperty("length") || input.length > len)
        return makeValidatorError("maxLength", msg);
    };
  }

  // 简单的验证手机号
  static phone(
    msg?: string,
    locale: MobilePhoneLocale = "zh-CN"
  ): AsyncValidateHandle {
    return (input) => {
      if (!isMobilePhone(input, locale))
        return makeValidatorError("phone", msg);
    };
  }

  static bool(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!(input === true || input === false))
        return makeValidatorError("bool", msg);
    };
  }

  static ipv4(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!isIP(input, 4)) return makeValidatorError("ipv4", msg);
    };
  }

  static ipv6(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!isIP(input, 6)) return makeValidatorError("ipv6", msg);
    };
  }

  static url(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!isURL(input)) return makeValidatorError("url", msg);
    };
  }

  static email(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!isEmail(input)) return makeValidatorError("email", msg);
    };
  }

  static max(max: number, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!Number.isFinite(input) || input > max)
        return makeValidatorError("max", msg);
    };
  }

  static min(min: number, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!Number.isFinite(input) || input < min)
        return makeValidatorError("min", msg);
    };
  }

  static hex(msg?: string): AsyncValidateHandle {
    return (input) => {
      const err = makeValidatorError("hex", msg);

      if (typeof input !== "string") return err;

      input = input.replace(/^0x/i, "");
      input = input.replace(/h$/i, "");
      if (/[^0-9a-fA-F]/.test(input)) return err;
    };
  }

  static number(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!Number.isFinite(input)) return makeValidatorError("number", msg);
    };
  }

  static int(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!Number.isSafeInteger(input)) return makeValidatorError("int", msg);
    };
  }

  static array(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!Array.isArray(input)) return makeValidatorError("array", msg);
    };
  }

  static object(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (Object.prototype.toString.call(input) !== "[object Object]")
        return makeValidatorError("object", msg);
    };
  }

  static json(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!isJSON(input)) return makeValidatorError("json", msg);
    };
  }

  static regexp(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!(input instanceof RegExp)) return makeValidatorError("regexp", msg);
    };
  }

  static string(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (typeof input !== "string") return makeValidatorError("string", msg);
    };
  }
}
