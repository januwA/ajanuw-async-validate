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
