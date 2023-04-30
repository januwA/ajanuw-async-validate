import { AbstractAsyncValidateResult } from "./AbstractAsyncValidateResult";
import { AnyObject } from "./interface";

export class AsyncValidateResult extends AbstractAsyncValidateResult {
  /**
   * 如果设置了这个静态函数
   * 当每个实例化的[AsyncValidate]的validate方法返回[AsyncValidateResult]实例前，会去调用[failHook]函数。
   */
  static failHook?: (result: AsyncValidateResult) => void;

  /**
   * 验证成功
   */
  get valid() {
    return !this.errors;
  }

  /**
   * 验证失败
   */
  get invalid() {
    return !this.valid;
  }

  constructor(readonly data: AnyObject) {
    super();
  }

  /**
   * field: 验证失败的字段名
   * error: { 验证器名称: 错误消息 }
   */
  mergeOneError(field: string, error: { [field: string]: AnyObject }) {
    if (!this.errors) (this as any).errors = {};

    if (!(this as any).errors[field]) (this as any).errors[field] = {};

    Object.assign(this.errors![field], error);
  }

  getError(errorCode: string, path: string): string | null {
    if (!path) return null;

    // name or address/zip
    const paths = path.split(/\/|\./).map((p) => p.trim());
    if (paths.length === 0) return null;

    const errors = paths.reduce((acc: any, _path: string) => {
      return acc[_path] ? acc[_path] : null;
    }, this.errors);

    return errors ? errors[errorCode] : null;
  }

  hasError(errorCode: string, path: string): boolean {
    return !!this.getError(errorCode, path);
  }
}
