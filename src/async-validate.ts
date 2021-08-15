import {
  AnyObject,
  AsyncValidateHandle,
  ValidateFailFileds,
  ValidateFailHandle,
  ValidateHandleArg,
} from "./interface";

const VALIDATORS = "validators";

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

  required?: ValidateHandleArg;
  validators?:
    | AsyncValidateHandle
    | AsyncValidateHandle[]
    | IValidateConfig /* to AsyncValidate */;

  // 监听单个字段的错误,当验证失败(invalid)时，调用
  fail?: (errors: { value: any; errors: AnyObject }) => void;

  [name: string]: any;
}

/**
 * 验证器配置
 */
export interface IValidateConfig {
  [key: string]:
    | null
    | AsyncValidateHandle
    | AsyncValidateHandle[]
    | AsyncValidateOptions;
}

export interface IOptions<T> {
  /**
   * 如果为true会检查完所有字段的验证器，否则检测失败直接返回
   *
   * default: false
   */
  checkAll?: boolean;

  /**
   * 字段验证失败时，用户处理错误的函数
   */
  fail?: ValidateFailHandle<T>;
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
 * 将不同的validators，处理为 AsyncValidateHandle[]
 * @param validators
 */
function handleValidators(
  validators?:
    | AsyncValidateHandle
    | AsyncValidateHandle[]
    | AsyncValidateOptions
): AsyncValidateHandle[] {
  if (!validators) return [];

  if (Array.isArray(validators)) return validators;

  if (typeof validators === "function") return [validators];

  if (isObject(validators)) {
    let vs: AsyncValidateHandle[] = [];

    // 映射AsyncValidate上的静态方法，如果不存在直接抛错，应为可能造成错误的结果
    for (const key in validators) {
      if ([VALIDATORS, "fail"].includes(key)) continue;
      if (AsyncValidate.hasOwnProperty(key)) {
        let arg: ValidateHandleArg = (validators as any)[key];
        if (!Array.isArray(arg)) arg = [arg];
        vs.push((AsyncValidate as any)[key](...arg));
      } else {
        throw new Error(`[[ AsyncValidate ]] not "${key}" validate.`);
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

export class AsyncValidate<
  T extends IValidateConfig,
  D = {
    [key in keyof T]?: any;
  }
> {
  options: IOptions<D>;

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

  constructor(public readonly validateConfig: T, options?: IOptions<D>) {
    this.options = Object.assign(
      {
        checkAll: false,
      },
      options
    );
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

  private _fail(errorFileds: ValidateFailFileds<D>) {
    if (isSuccess(errorFileds)) return;
    if (this.options.fail) this.options.fail(errorFileds);
    else if (AsyncValidate.fail) AsyncValidate.fail(errorFileds);
  }

  /**
   *
   * @param data 需要验证的数据
   * @param handleFail 接收错误回调
   * @returns
   */
  async validate(
    data: D,
    handleFail?: (errorFileds: ValidateFailFileds<D>) => void
  ): Promise<boolean> {
    const errorFileds: ValidateFailFileds<D> = {};
    let success = true;
    data ??= {} as D;

    for (const [key, keyValidate] of Object.entries(this.validateConfig)) {
      // 验证器设置为空，将跳过检测
      if (!keyValidate) continue;

      if ( !(key in data) ) {
        throw new Error(`AsyncValidate Error: 没有 ${key} 数据!`)
      }

      const value = (data as any)[key];

      await this.checkValue(keyValidate, value, data, (error) => {
        errorFileds[key] ??= {
          value,
          data,
          errors: {},
        };
        Object.assign(errorFileds[key].errors, error);
      });

      // 每个字段中定义的 fail
      if (key in errorFileds && "fail" in keyValidate) {
        keyValidate.fail?.(errorFileds[key]);
      }

      // 验证失败调用fail
      success = isSuccess(errorFileds);
      if (!success && !this.options.checkAll) break;

      if (hasValidators(keyValidate) && isObject(keyValidate.validators)) {
        const av = new AsyncValidate<any, any>(
          keyValidate.validators as IValidateConfig,
          this.options
        );
        success = await av.validate(value);
        if (!success && !this.options.checkAll) break;
      }
    } // for end

    if (!success) {
      this._fail(errorFileds);
      handleFail?.(errorFileds);
    }
    return success;
  }

  // 必填
  static required(msg: string): AsyncValidateHandle {
    return (input) => {
      if (!input) return { required: msg };
    };
  }

  // 最小长度
  static minLength(len: number, msg: string): AsyncValidateHandle {
    return (input) => {
      if (input.length < parseFloat(len as any)) return { minLength: msg };
    };
  }

  // 最大长度
  static maxLength(len: number, msg: string): AsyncValidateHandle {
    return (input) => {
      if (input.length > parseFloat(len as any)) return { maxLength: msg };
    };
  }

  // 简单的验证手机号
  private static PHONE_EXP =
    /^((13[0-9])|(14[0-9])|(15[0-9])|(16[0-9])|(17[0-9])|(18[0-9])|(19[0-9]))\d{8}$/;
  static phone(msg: string): AsyncValidateHandle {
    return (input) => {
      if (typeof input === "string" && !input.match(AsyncValidate.PHONE_EXP)) {
        return { phone: msg };
      }
    };
  }

  // 简单的判断相等
  static eql(data: any, msg: string): AsyncValidateHandle {
    return (input) => {
      if (input !== data) return { eql: msg };
    };
  }

  // 简单的判断相等
  static equal(data: any, msg: string): AsyncValidateHandle {
    return (input) => {
      if (input != data) return { equal: msg };
    };
  }

  /**
   * 必须为bool
   * @param msg
   */
  static bool(msg: string): AsyncValidateHandle {
    return (input) => {
      if (!(input === true || input === false)) return { bool: msg };
    };
  }

  private static EMAIL_EXP =
    /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  static email(msg: string): AsyncValidateHandle {
    return (input: string) => {
      if (!input.match(AsyncValidate.EMAIL_EXP)) return { email: msg };
    };
  }

  static max(max: number, msg: string): AsyncValidateHandle {
    return (input) => {
      if (!isNaN(input) && input > parseFloat(max as any)) return { max: msg };
    };
  }

  static min(min: number, msg: string): AsyncValidateHandle {
    return (input) => {
      if (!isNaN(input) && input < parseFloat(min as any)) return { min: msg };
    };
  }

  static hex(msg: string): AsyncValidateHandle {
    return (input: string) => {
      input = input.replace(/^0x/i, "");
      input = input.replace(/h$/i, "");
      if (/[^0-9a-fA-F]/.test(input)) return { hex: msg };
    };
  }

  static number(msg: string): AsyncValidateHandle {
    return (input: number) => {
      // 必须是有穷数的数字
      if (!Number.isFinite(input) || typeof input !== "number")
        return { number: msg };
    };
  }

  static int(msg: string): AsyncValidateHandle {
    return (input: number, data) => {
      if (this.number("")(input, data) || !Number.isSafeInteger(input))
        return { int: msg };
    };
  }

  static float(msg: string): AsyncValidateHandle {
    return (input: number, data) => {
      if (this.number("")(input, data) || Number.isInteger(input))
        return { float: msg };
    };
  }

  static array(msg: string): AsyncValidateHandle {
    return (input: number) => {
      if (!Array.isArray(input)) return { array: msg };
    };
  }

  static object(msg: string): AsyncValidateHandle {
    return (input) => {
      if (Object.prototype.toString.call(input) !== "[object Object]")
        return { object: msg };
    };
  }

  static json(msg: string): AsyncValidateHandle {
    return (input) => {
      try {
        JSON.parse(input);
      } catch (error) {
        return { json: msg };
      }
    };
  }

  static regexp(msg: string): AsyncValidateHandle {
    return (input) => {
      if (!(input instanceof RegExp)) return { regexp: msg };
    };
  }
}
