import { AbstractAsyncValidateResult } from "./AbstractAsyncValidateResult";
import {
  AnyObject,
  AsyncValidateHandle,
  AsyncValidateOptionValue,
} from "./interface";

/**
 * 提取第一个错误字段的第一个错误消息
 */
export function firstErrorMsg(result: AbstractAsyncValidateResult) {
  if (result.errors && Object.keys(result.errors).length) {
    const fErrors = Object.values(result.errors)[0];
    const msgs = Object.values(fErrors);
    return msgs[0];
  }
}

/**
 * 将不同的validators,处理为 AsyncValidateHandle[]
 * @param validators
 */
export function handleValidators(
  validators?: AsyncValidateOptionValue
): AsyncValidateHandle[] {
  if (!validators) return [];

  // AsyncValidateHandle
  if (typeof validators === "function") return [validators];

  // AsyncValidateHandle[]
  if (Array.isArray(validators)) return validators;

  return [];
}

/**
 *
 * @param keyValidate 验证器
 * @param value 验证的数据
 * @param data 所有数据
 * @param errorCallback 验证失败时的回调
 */
export async function checkValue(
  keyValidate: AsyncValidateOptionValue,
  value: any,
  data: AnyObject
): Promise<AnyObject[]> {
  let errors = [];
  for (const h of handleValidators(keyValidate)) {
    const error = await h(value, data);
    if (error) errors.push(error);
  }
  return errors;
}

export function makeValidatorError(errCode: string, msg?: string) {
  return { [errCode]: msg ? msg : true };
}
