import { Validators } from "./Validators";
import {
  AnyObject,
  AsyncValidateConfig,
  AsyncValidateHandles,
  AsyncValidateObject,
  AsyncValidateOptionValue,
  ValidateFailFileds,
  ValidateFailHandle,
  ValidateHandleArg,
} from "./interface";

const VALIDATORS_KEY = "validators";
const CHILDREN_KEY = "children";

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

/**
 * 将不同的validators,处理为 AsyncValidateHandles
 * @param validators
 */
function handleValidators(
  validators?: AsyncValidateOptionValue
): AsyncValidateHandles {
  if (!validators) return [];

  // AsyncValidateHandle
  if (typeof validators === "function") return [validators];

  // AsyncValidateHandles
  if (Array.isArray(validators)) return validators;

  // AsyncValidateObject
  if (isObject(validators)) {
    let vs: AsyncValidateHandles = [];

    for (const key in validators) {
      if (key === CHILDREN_KEY) continue;

      if (key === VALIDATORS_KEY) {
        vs = vs.concat(handleValidators(validators.validators));
        continue;
      }

      if (Object.hasOwn(Validators, key)) {
        let arg: ValidateHandleArg = validators[key];
        if (!Array.isArray(arg)) arg = [arg];
        vs.push((Validators as any)[key](...arg));
      } else {
        throw new Error(`Validators not "${key}" validate.`);
      }
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
  T extends AsyncValidateConfig,
  D extends {
    [key in keyof T]?: any;
  }
> extends AbstractAsyncValidate<D> {
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

  constructor(public readonly config: T) {
    super();
  }

  /**
   *
   * @param keyValidate 验证器
   * @param value 验证的数据
   * @param data 所有数据
   * @param errorCallback 验证失败时的回调
   */
  private async checkValue(
    keyValidate: AsyncValidateOptionValue,
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
    AsyncValidate.fail?.(errorFileds);
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

    for (const [key, valueValidate] of Object.entries(this.config)) {
      if (valueValidate === Validators.Ignore) continue;

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

      if (
        isObject(valueValidate) &&
        (valueValidate as AsyncValidateObject).children
      ) {
        const av = new AsyncValidate<any, any>(
          (valueValidate as AsyncValidateObject).children
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
}
