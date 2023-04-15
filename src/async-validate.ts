import {
  AnyObject,
  AsyncValidateHandle,
  ValidateFailFileds,
  ValidateFailHandle,
  ValidateHandleArg,
} from "./interface";

const VALIDATORS = "validators";

// 忽略字段检测
const KIgnore = Symbol("ignore");

export interface AsyncValidateOptions {
  string?: ValidateHandleArg;
  number?: ValidateHandleArg;
  bool?: ValidateHandleArg;
  float?: ValidateHandleArg;
  int?: ValidateHandleArg; // Number.isSafeInteger()
  object?: ValidateHandleArg; // "[object Object]"
  array?: ValidateHandleArg; // Array.isArray()
  json?: ValidateHandleArg; // try JSON.parse()
  email?: ValidateHandleArg;
  hex?: ValidateHandleArg; // 0x0A 0Ah 0A
  regexp?: ValidateHandleArg; // /a/ new RegExp()

  or?: ValidateHandleArg;
  and?: ValidateHandleArg;

  required?: ValidateHandleArg;
  validators?:
    | AsyncValidateHandle
    | AsyncValidateHandle[]
    | IValidateConfig /* to AsyncValidate */;

  [name: string]: any; // enum
}

type AsyncValidateCheck =
  | AsyncValidateHandle
  | AsyncValidateHandle[]
  | AsyncValidateOptions;

/**
 * 验证器配置
 */
export interface IValidateConfig {
  [key: string]: Symbol | AsyncValidateCheck;
}

export interface IOptions<D> {
  /**
   * 如果为true会检查完所有字段的验证器，接返回否则检测失败直接返回
   * default: false
   */
  checkAll?: boolean;

  /**
   * 字段验证失败时，用户处理错误的函数
   */
  fail?: ValidateFailHandle<D>;
}

function isSuccess<T>(errorFileds: ValidateFailFileds<T>) {
  return Object.keys(errorFileds).length === 0;
}

function isObject(data: any): boolean {
  return Object.prototype.toString.call(data) === "[object Object]";
}

function hasValidators(obj: any): obj is AsyncValidateOptions {
  return obj.hasOwnProperty("validators");
}

/**
 * 将不同的validators,处理为 AsyncValidateHandle[]
 * @param validators
 */
function handleValidators(
  validators?: AsyncValidateCheck
): AsyncValidateHandle[] {
  if (!validators) return [];

  if (Array.isArray(validators)) return validators;

  if (typeof validators === "function") return [validators];

  if (isObject(validators)) {
    let vs: AsyncValidateHandle[] = [];

    // 映射AsyncValidate上的静态方法，如果不存在直接抛错，应为可能造成错误的结果
    for (const key in validators) {
      if ([VALIDATORS].includes(key)) continue;
      if (AsyncValidate.hasOwnProperty(key)) {
        let arg: ValidateHandleArg = (validators as any)[key];
        if (!Array.isArray(arg)) arg = [arg];
        vs.push((AsyncValidate as any)[key](...arg));
      } else {
        throw new Error(`AsyncValidate not "${key}" validate.`);
      }
    }

    if (
      !(validators.validators instanceof AsyncValidate) &&
      !isObject(validators.validators)
    ) {
      vs = vs.concat(handleValidators(validators.validators));
    }

    return vs;
  }

  return [];
}

abstract class AbstractAsyncValidate<D> {
  name = "";
  setName(name: string): void {
    this.name = name;
  }
  abstract validate(data: D, opt?: IOptions<D>): Promise<boolean>;
}

export class AsyncValidate<
  T extends IValidateConfig,
  D extends {
    [key in keyof T]?: any;
  }
> extends AbstractAsyncValidate<D> {
  static IGNORE = KIgnore;

  /**
   * 设置所有验证器的错误处理
   */
  static fail?: ValidateFailHandle<any>;

  /**
   * 提取第一个错误字段的第一个错误消息
   *
   * ```js
   * err = AsyncValidate.firstError({
   *   name: { errors: { required: 'name is required!' }, value: ''}
   * })
   *
   * err === 'name is required!'
   * ```
   */
  static firstError(errorFields: ValidateFailFileds<any>) {
    if (errorFields && Object.keys(errorFields).length) {
      return Object.values(errorFields[Object.keys(errorFields)[0]].errors)[0];
    }
  }

  constructor(public readonly validateConfig: T) {
    super();
  }

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
        if (!AsyncValidate.hasOwnProperty(k)) return k;
      })
      .forEach((k) => ((AsyncValidate as any)[k] = (handles as any)[k]));
  }

  /**
   *
   * @param keyValidate 验证器
   * @param value 验证的数据
   * @param data 所有数据
   * @param errorCallback 验证失败时的回调
   */
  private async checkValue(
    keyValidate:
      | AsyncValidateHandle
      | AsyncValidateHandle[]
      | AsyncValidateOptions,
    value: any,
    data: AnyObject,
    errorCallback: (validate: AnyObject) => void
  ) {
    for (const h of handleValidators(keyValidate)) {
      const error = await h(value, data);
      if (error) errorCallback(error);
    }
  }

  private callGlobalFailHandle(errorFileds: ValidateFailFileds<D>) {
    if (isSuccess(errorFileds)) return;
    if (AsyncValidate.fail) AsyncValidate.fail(errorFileds);
  }

  /**
   * 验证数据
   * @param data 需要验证的数据
   * @param handleFail 接收错误回调
   * @returns
   */
  async validate(data: D, opt?: IOptions<D>): Promise<boolean> {
    data ??= {} as D;
    opt ??= Object.assign({ checkAll: false }, opt);
    const errorFileds: ValidateFailFileds<D> = {};
    let success = true;

    for (const [key, valueValidate] of Object.entries(this.validateConfig)) {
      if (valueValidate === KIgnore) continue;

      if (!(key in data)) {
        throw new Error(`AsyncValidate Error: "${key}" not data`);
      }

      const value = data[key];

      await this.checkValue(valueValidate, value, data, (error) => {
        errorFileds[key] ??= {
          value,
          data,
          errors: {},
        };
        Object.assign(errorFileds[key].errors, error);
      });

      // 验证失败调用fail
      success = isSuccess(errorFileds);
      if (!success && !opt.checkAll) break;

      if (hasValidators(valueValidate) && isObject(valueValidate.validators)) {
        const av = new AsyncValidate<any, any>(
          valueValidate.validators as IValidateConfig
        );

        const opt2: IOptions<any> = { checkAll: opt.checkAll };
        if (opt.fail) {
          opt2.fail = (erFields) => {
            errorFileds[key] ??= {
              value,
              data,
              errors: {},
            };
            errorFileds[key].children = erFields;
          };
        }

        success = await av.validate(value, opt2);
        if (!success && !opt.checkAll) break;
      }
    } // for end

    if (!success) {
      this.callGlobalFailHandle(errorFileds);
      opt.fail?.(errorFileds);
    }
    return success;
  }

  //======================👇静态验证函数========================//

  /**
   *
   * @param validators 测试表达式
   * @param msg 错误消息
   * @returns
   */
  static and(validators: AsyncValidateHandle[], msg?: string) {
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
  static or(validators: AsyncValidateHandle[], msg?: string) {
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
      if (
        !input.hasOwnProperty("length") ||
        input.length < parseFloat(len as any)
      )
        return { minLength: msg };
    };
  }

  // 最大长度
  static maxLength(len: number, msg?: string): AsyncValidateHandle {
    return (input) => {
      if (
        !input.hasOwnProperty("length") ||
        input.length > parseFloat(len as any)
      )
        return { maxLength: msg };
    };
  }

  // 简单的验证手机号
  private static PHONE_EXP =
    /^((13[0-9])|(14[0-9])|(15[0-9])|(16[0-9])|(17[0-9])|(18[0-9])|(19[0-9]))\d{8}$/;
  static phone(msg?: string): AsyncValidateHandle {
    return (input) => {
      if (typeof input === "string" && !input.match(AsyncValidate.PHONE_EXP)) {
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

  private static EMAIL_EXP =
    /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  static email(msg?: string): AsyncValidateHandle {
    return (input: string) => {
      if (!input.match(AsyncValidate.EMAIL_EXP)) return { email: msg };
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
