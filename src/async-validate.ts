/**
 * 需要验证的数据
 */
export interface ValidateData {
  [key: string]: any;
}

/**
 * 验证器配置
 */
export interface AsyncValidateOption {
  [key: string]: AsyncValidateHandle[];
}

/**
 * 字段的验证函数
 */
export interface AsyncValidateHandle {
  (input: any, data: ValidateData):
    | string
    | undefined
    | Promise<string | undefined>;
}

/**
 * 处理error message的函数
 */
export interface ValidateErrorHandle {
  (errorMessage: string): void;
}

export class AsyncValidate {
  /**
   * 当每个字段验证失败将调用这个函数（默认）
   */
  static validateErrorHandle?: ValidateErrorHandle;

  constructor(
    public readonly options: AsyncValidateOption,
    public readonly validateErrorHandle?: ValidateErrorHandle
  ) {}

  /**
   * 开始验证
   * @param data
   */
  async validate(data: ValidateData): Promise<boolean> {
    let result = true;

    // 遍历需要验证的数据
    for (const key in data) {
      const value = data[key];

      // 是否设置了这个字段的验证器
      if (!this.options.hasOwnProperty(key)) {
        console.warn(`[[ AsyncValidate ]] 没有设置[${key}]的验证器.`);
        result = false;
        break;
      }

      // 遍历验证器
      for (const validate of this.options[key]) {
        const errorMessage = await validate(value, data);
        if (errorMessage) {
          // 验证失败
          if (this.validateErrorHandle) this.validateErrorHandle(errorMessage);
          else if (AsyncValidate.validateErrorHandle)
            AsyncValidate.validateErrorHandle(errorMessage);
          result = false;
          break;
        }
      }

      if (!result) break;
    }

    return result;
  }

  // 必填
  static required(msg: string): AsyncValidateHandle {
    return (input) => {
      if (!input) return msg;
    };
  }

  // 最小长度
  static minLength(len: number, msg: string): AsyncValidateHandle {
    return (input) => {
      if (typeof input === "string" && input.length < len) return msg;
    };
  }

  // 最大长度
  static maxLength(len: number, msg: string): AsyncValidateHandle {
    return (input) => {
      if (typeof input === "string" && input.length > len) return msg;
    };
  }

  // 简单的验证手机号
  private static PHONE_EXP = /^((13[0-9])|(14[0-9])|(15[0-9])|(16[0-9])|(17[0-9])|(18[0-9])|(19[0-9]))\d{8}$/;
  static phone(msg: string, exp?: RegExp): AsyncValidateHandle {
    const phoneExp = exp ?? AsyncValidate.PHONE_EXP;
    return (input) => {
      if (typeof input === "string" && !input.match(phoneExp)) {
        return msg;
      }
    };
  }

  // 简单的判断相等
  static eql(data: any, msg: string): AsyncValidateHandle {
    return (input) => {
      if (input !== data) return msg;
    };
  }

  // 简单的判断相等
  static equal(data: any, msg: string): AsyncValidateHandle {
    return (input) => {
      if (input != data) return msg;
    };
  }

  /**
   * 必须为bool
   * @param msg
   */
  static bool(msg: string): AsyncValidateHandle {
    return (input) => {
      if (input !== true || input !== false) return msg;
    };
  }

  private static EMAIL_EXP = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  static email(msg: string): AsyncValidateHandle {
    return (input: string) => {
      if (!input.match(AsyncValidate.EMAIL_EXP)) return msg;
    };
  }

  static max(max: number, msg: string): AsyncValidateHandle {
    return (input) => {
      if (!isNaN(input) && input > max) return msg;
    };
  }

  static min(min: number, msg: string): AsyncValidateHandle {
    return (input) => {
      if (!isNaN(input) && input < min) return msg;
    };
  }
}
