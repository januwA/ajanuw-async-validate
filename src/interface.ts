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
