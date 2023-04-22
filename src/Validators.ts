import { AsyncValidateHandle, AsyncValidateHandles } from "./interface";

/**
 * 验证手机号正则表达式
 */
const KPhoneRegExp =
  /^((13[0-9])|(14[0-9])|(15[0-9])|(16[0-9])|(17[0-9])|(18[0-9])|(19[0-9]))\d{8}$/;

/**
 * 验证邮箱账号正则表达式
 */
const KEmailRegExp =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export class Validators {
  /**
   * 忽略字段检测
   */
  static Ignore = Symbol("ignore");

  /**
   * 定义全局的验证器
   * 
   * ## Example
   * 
   * ```ts
   AsyncValidate.mixin({
      num(c: any[], msg: string) {
        return (input) => {
          if (!c.includes(input)) return msg;
        };
      },
    })
   * ```
   */
  static mixin(handles: {
    [name: string]: (...args: any[]) => AsyncValidateHandle;
  }) {
    Object.keys(handles)
      .filter((k) => {
        if (!Validators.hasOwnProperty(k)) return k;
      })
      .forEach((k) => ((Validators as any)[k] = handles[k]));
  }

  /**
   *
   * @param validators 测试表达式
   * @param msg 错误消息
   * @returns
   */
  static and(validators: AsyncValidateHandles, msg?: string) {
    return async (input: any, data: any) => {
      for await (const v of validators) {
        if (await v(input, data)) return { and: msg };
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
  static or(validators: AsyncValidateHandles, msg?: string) {
    return async (input: any, data: any) => {
      let r: any;
      for await (const v of validators) {
        r = await v(input, data);
        if (!r) return null;
      }

      return { or: msg };
    };
  }

  // 必填
  static required(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!input) return { required: msg };
    };
  }

  // length 长度判断
  static len(size: number, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!input.hasOwnProperty("length") || input.length !== size)
        return { len: msg };
    };
  }

  // 最小长度
  static minLength(len: number, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!input.hasOwnProperty("length") || input.length < len)
        return { minLength: msg };
    };
  }

  // 最大长度
  static maxLength(len: number, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!input.hasOwnProperty("length") || input.length > len)
        return { maxLength: msg };
    };
  }

  // 简单的验证手机号
  static phone(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (typeof input === "string" && !input.match(KPhoneRegExp)) {
        return { phone: msg };
      }
    };
  }

  // 简单的判断相等
  static eql(data: any, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (input !== data) return { eql: msg };
    };
  }

  // 简单的判断相等
  static equal(data: any, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (input != data) return { equal: msg };
    };
  }

  /**
   * 必须为bool
   * @param msg
   */
  static bool(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!(input === true || input === false)) return { bool: msg };
    };
  }

  static email(msg?: string): AsyncValidateHandle {
    return (input: string) => {
      if (typeof input === "string" && !input.match(KEmailRegExp))
        return { email: msg };
    };
  }

  static max(max: number, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!isNaN(input) && input > parseFloat(max as any)) return { max: msg };
    };
  }

  static min(min: number, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!isNaN(input) && input < parseFloat(min as any)) return { min: msg };
    };
  }

  static hex(msg?: string): AsyncValidateHandle {
    return (input: string) => {
      input = input.replace(/^0x/i, "");
      input = input.replace(/h$/i, "");
      if (/[^0-9a-fA-F]/.test(input)) return { hex: msg };
    };
  }

  static number(msg?: string): AsyncValidateHandle {
    return (input: number) => {
      // 必须是有穷数的数字
      if (!Number.isFinite(input) || typeof input !== "number")
        return { number: msg };
    };
  }

  static int(msg?: string): AsyncValidateHandle {
    return (input: number, data) => {
      if (this.number("")(input, data) || !Number.isSafeInteger(input))
        return { int: msg };
    };
  }

  static float(msg?: string): AsyncValidateHandle {
    return (input: number, data) => {
      if (this.number("")(input, data) || Number.isInteger(input))
        return { float: msg };
    };
  }

  static array(msg?: string): AsyncValidateHandle {
    return (input: number) => {
      if (!Array.isArray(input)) return { array: msg };
    };
  }

  static object(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (Object.prototype.toString.call(input) !== "[object Object]")
        return { object: msg };
    };
  }

  static json(msg?: string): AsyncValidateHandle {
    return (input) => {
      try {
        JSON.parse(input);
      } catch (error) {
        return { json: msg };
      }
    };
  }

  static regexp(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (!(input instanceof RegExp)) return { regexp: msg };
    };
  }

  static string(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (typeof input === "string") return null;
      return { string: msg };
    };
  }
}
