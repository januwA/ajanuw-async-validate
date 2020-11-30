export interface AnyObject {
  [k: string]: any;
}

/**
 * 用户需要验证的数据
 *
 * ## Example
 *
 * ```js
 *await av.validate({
 *  name: "ajanuw",
 *  pwd: "12345678",
 *  pwd2: "12345678",
 *})
 * ```
 */
export interface ValidateData extends AnyObject {}

/**
 * [ValidateData] 中的字段需要的验证函数
 *
 * - 验证成功返回undefined，否则返回错误对象
 */
export interface AsyncValidateHandle {
  (input: any, data: ValidateData):
    | AnyObject
    | undefined
    | Promise<AnyObject | undefined>;
}

/**
 * 如果需要传递多个参数，那么数组最后一个应该是error message
 */
export type ValidateHandleArg = string | any[];

/**
 * 一种简便的方式设置验证器
 * 
 * ```ts
  const av = new AsyncValidate({
    name: {
      required: "名称必填",
      validate: [
        AsyncValidate.minLength(6, "姓名最少需要6个字符"),
        async function (input) {
          if (!(await checkName(input as string))) return "检测名称失败";
        },
      ],
    },
    pwd: [
      AsyncValidate.required("密码必填"),
      AsyncValidate.minLength(8, "密码最少需要8个字符"),
    ],
    pwd2: {
      required: "填写确认密码",
      validate: function (input, data) {
        if (input !== data.pwd) return "两次密码填写不一样";
      },
    },
  });
 * ```
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
  validators?: AsyncValidate | AsyncValidateHandle | AsyncValidateHandle[];

  // 通常用来处理object对象
  fields?: AsyncValidateOptions;

  // 监听单个字段的错误,当验证失败(invalid)时，调用
  fail?: (errors: { value: any; errors: AnyObject }) => void;

  [name: string]: any;
}

/**
 * 验证器配置
 */
export interface Options {
  [key: string]:
    | AsyncValidateHandle
    | AsyncValidateHandle[]
    | AsyncValidateOptions;
}

export interface ValidateFailFileds {
  /**
   * name 验证失败的字段
   */
  [name: string]: {
    value: any;
    errors: AnyObject;
  };
}

/**
 * 处理error的函数
 */
export interface ValidateFailHandle {
  (errorFields: ValidateFailFileds): void;
}

export interface ValidateConfig {
  /**
   * 如果为false, 那么检查到一个字段失败，直接返回失败，其余字段将不会进行检查
   * 如果为true, 那么检查检查完所有字段的验证器
   */
  checkAll?: boolean;

  /**
   * validateErrorHandle 错误回调
   */
  fail?: ValidateFailHandle;
}

export class AsyncValidate {
  config: ValidateConfig;

  /**
   * 设置这个错误处理函数，将用在所有的验证器上
   */
  static fail?: ValidateFailHandle;

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

  constructor(public readonly options: Options, config?: ValidateConfig) {
    this.config = Object.assign(
      {
        checkAll: false,
      },
      config
    );
  }

  private _isSuccess(errorFileds: ValidateFailFileds) {
    return Object.keys(errorFileds).length === 0;
  }

  private _handleValidate(
    validators?:
      | AsyncValidateHandle
      | AsyncValidateHandle[]
      | AsyncValidateOptions
  ): AsyncValidateHandle[] {
    if (!validators) return [];

    if (Array.isArray(validators)) return validators;

    if (typeof validators === "function") return [validators];

    if (Object.prototype.toString.call(validators) === "[object Object]") {
      let vs: AsyncValidateHandle[] = [];

      // 映射AsyncValidate上的静态方法，如果不存在直接抛错，应为可能造成错误的结果
      for (const key in validators) {
        if (["validators", "fail"].includes(key)) continue;
        if (AsyncValidate.hasOwnProperty(key)) {
          let arg: ValidateHandleArg = (validators as any)[key];
          if (!Array.isArray(arg)) arg = [arg];
          const v = (AsyncValidate as any)[key](...arg);
          vs.push(v);
        } else {
          throw new Error(`[[ AsyncValidate ]] not set "${key}" validate.`);
        }
      }

      if (!(validators.validators instanceof AsyncValidate))
        vs = vs.concat(this._handleValidate(validators.validators));

      return vs;
    }

    return [];
  }

  private async _eachValidates(
    key: string,
    value: any,
    data: ValidateData,
    cb: (validate: AnyObject) => void
  ) {
    const validators = this._handleValidate(this.options[key]);
    for (const h of validators) {
      const error = await h(value, data);
      if (error) cb(error);
    }
  }

  private _fail(errorFileds: ValidateFailFileds) {
    if (this.config.fail) this.config.fail(errorFileds);
    else if (AsyncValidate.fail) AsyncValidate.fail(errorFileds);
  }

  /**
   * 开始验证
   * @param data
   */
  async validate(data: ValidateData): Promise<boolean> {
    const errorFileds: ValidateFailFileds = {};
    let success: boolean = this._isSuccess(errorFileds);

    // 遍历需要验证的数据
    for (const key in data) {
      const value: any = data[key];

      // 是否设置了这个字段的验证器
      if (!this.options.hasOwnProperty(key)) {
        console.warn(`[[ AsyncValidate ]] "${key}" validate is not set.`);
        continue;
      }

      // 遍历验证器
      await this._eachValidates(key, value, data, (error) => {
        if (!errorFileds[key]) {
          errorFileds[key] = {
            value,
            errors: {},
          };
        }
        Object.assign(errorFileds[key].errors, error);
      });

      // 每个字段中定义的fail
      if (
        errorFileds.hasOwnProperty(key) &&
        this.options[key].hasOwnProperty("fail")
      ) {
        (this.options[key] as any).fail(errorFileds[key]);
      }

      // 每当一个字段出现错误,触发验证器的fail
      success = this._isSuccess(errorFileds);
      if (!success && !this.config.checkAll) {
        this._fail(errorFileds);
        break;
      }

      // object验证
      if (
        this.options[key].hasOwnProperty("validators") &&
        (this.options[key] as AsyncValidateOptions).validators instanceof
          AsyncValidate
      ) {
        const av = (this.options[key] as AsyncValidateOptions)
          .validators as AsyncValidate;
        if (!av.config.fail) {
          av.config.fail = this.config.fail;
        }
        success = await av.validate(value);
        if (!this.config.checkAll && !success) {
          break;
        }
      }
    }

    if (!success && this.config.checkAll) {
      this._fail(errorFileds);
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
      if (typeof input === "string" && input.length < parseFloat(len as any))
        return { minLength: msg };
    };
  }

  // 最大长度
  static maxLength(len: number, msg: string): AsyncValidateHandle {
    return (input) => {
      if (typeof input === "string" && input.length > parseFloat(len as any))
        return { maxLength: msg };
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
