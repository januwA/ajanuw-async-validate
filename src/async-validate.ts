import {
  AnyObject,
  AsyncValidateHandle,
  ValidateFailFileds,
  ValidateFailHandle,
  ValidateHandleArg,
} from "./interface";

/**
 * 一种简便的方式设置验证器
 *
 * 详见测试
 */
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
    | AsyncValidate
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

export interface IOptions {
  /**
   * 如果为false, 检查到一个字段失败，直接返回失败，其余字段将不会进行检查
   *
   * 如果为true, 会检查完所有字段的验证器
   *
   * default: false
   */
  checkAll?: boolean;

  /**
   * 字段验证失败时，用户处理错误的函数
   */
  fail?: ValidateFailHandle;

  /**
   * 无视掉没有设置验证器的字段
   *
   * default: true
   */
  ignore?: boolean;
}

function isSuccess(errorFileds: ValidateFailFileds) {
  return Object.keys(errorFileds).length === 0;
}

function isObject(data: any): boolean {
  return Object.prototype.toString.call(data) === "[object Object]";
}

const VALIDATORS = "validators";

function isValidators(obj: any): obj is AsyncValidateOptions {
  return obj.hasOwnProperty(VALIDATORS);
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
        const v = (AsyncValidate as any)[key](...arg);
        vs.push(v);
      } else {
        throw new Error(`[[ AsyncValidate ]] not set "${key}" validate.`);
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

export class AsyncValidate {
  options: IOptions;

  /**
   * 设置所有验证器的错误处理
   */
  static fail?: ValidateFailHandle;

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
  static firstError(errorFields: ValidateFailFileds) {
    if (errorFields && Object.keys(errorFields).length) {
      return Object.values(errorFields[Object.keys(errorFields)[0]].errors)[0];
    }
  }

  constructor(
    public readonly validateConfig: IValidateConfig,
    options?: IOptions
  ) {
    this.options = Object.assign(
      {
        checkAll: false,
        ignore: true,
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

  private async _eachValidators(
    key: string,
    value: any,
    data: AnyObject,
    errorCallback: (validate: AnyObject) => void
  ) {
    if (this.validateConfig[key] !== null) {
      const validators = handleValidators(this.validateConfig[key]!);
      for (const h of validators) {
        const error = await h(value, data);
        if (error) errorCallback(error);
      }
    }
  }

  private _fail(errorFileds: ValidateFailFileds) {
    if (isSuccess(errorFileds)) return;
    if (this.options.fail) this.options.fail(errorFileds);
    else if (AsyncValidate.fail) AsyncValidate.fail(errorFileds);
  }

  /**
   * 验证数据
   * @param data
   */
  async validate(data: AnyObject): Promise<boolean> {
    const errorFileds: ValidateFailFileds = {};
    let success = true;

    // 遍历需要验证的数据
    for (const [key, value] of Object.entries(data)) {
      // 是否设置了这个字段的验证器
      if (!this.validateConfig.hasOwnProperty(key)) {
        if (!this.options.ignore)
          console.warn(`[[ AsyncValidate ]] "${key}" validate is not set.`);
        continue;
      }

      const keyValidate = this.validateConfig[key];

      // 字段验证设置为null，将跳过验证
      if (keyValidate === null) continue;

      // 遍历这个字段的验证器
      await this._eachValidators(key, value, data, (error) => {
        if (!errorFileds[key]) {
          errorFileds[key] = {
            value,
            errors: {},
          };
        }
        Object.assign(errorFileds[key].errors, error);
      });

      // 每个字段中定义的fail，会被通知错误
      if (
        errorFileds.hasOwnProperty(key) &&
        keyValidate.hasOwnProperty("fail")
      ) {
        (keyValidate as any).fail(errorFileds[key]);
      }

      // 每当一个字段出现错误,触发验证器的fail，然后结束验证
      success = isSuccess(errorFileds);
      if (!success && !this.options.checkAll) {
        this._fail(errorFileds);
        break;
      }

      // validators: {} to validators: new AsyncValidate({}, parentOptions)
      if (isValidators(keyValidate) && isObject(keyValidate.validators)) {
        keyValidate.validators = new AsyncValidate(
          keyValidate.validators as IValidateConfig,
          this.options
        );
      }

      // object验证，使用AsyncValidate
      if (
        isValidators(keyValidate) &&
        keyValidate.validators instanceof AsyncValidate
      ) {
        const av = keyValidate.validators;
        if (!av.options.fail) av.options.fail = this.options.fail;
        success = await av.validate(value);
        if (!success && !this.options.checkAll) break;
      }
    } // for end

    if (!success && this.options.checkAll) this._fail(errorFileds);
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
  private static PHONE_EXP = /^((13[0-9])|(14[0-9])|(15[0-9])|(16[0-9])|(17[0-9])|(18[0-9])|(19[0-9]))\d{8}$/;
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

  private static EMAIL_EXP = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

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
