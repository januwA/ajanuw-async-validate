export interface AnyObject {
  [k: string]: any;
}

export type AsyncValidateResult = AnyObject | undefined | null;
export type AsyncValidatePromiseResult = Promise<AsyncValidateResult>;

export interface AsyncValidateHandle {
  (input: any, data: AnyObject):
    | AsyncValidateResult
    | AsyncValidatePromiseResult;
}

export type AsyncValidateHandles = AsyncValidateHandle[];

export interface AsyncValidateObject {
  required?: ValidateHandleArg;
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

  validators?: AsyncValidateHandle | AsyncValidateHandles; // 自定义验证器或Validators提供的验证器
  children?: AsyncValidateConfig; // 对象嵌套验证

  [name: string]: any; // enum
}

export type AsyncValidateOptionValue =
  | AsyncValidateHandle
  | AsyncValidateHandles
  | AsyncValidateObject;

/**
 * 验证器配置
 */
export interface AsyncValidateConfig {
  [key: string]: Symbol | AsyncValidateOptionValue;
}

/**
 * 如果需要传递多个参数，那么数组最后一个应该是error message
 */
export type ValidateHandleArg = string | any[];

export interface ValidateFailFileds<D> {
  /**
   * name 验证失败的字段
   */
  [name: string]: {
    value: any;
    data: D;
    errors: AnyObject;
    children?: ValidateFailFileds<any>;
  };
}

/**
 * 处理error的函数
 */
export interface ValidateFailHandle<D> {
  (errorFields: ValidateFailFileds<D>): void;
}
