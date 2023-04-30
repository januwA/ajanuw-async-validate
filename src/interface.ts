import { AbstractAsyncValidate } from "./AbstractAsyncValidate";

export interface AnyObject {
  [k: string]: any;
}

export type AsyncValidateFunctionResult = AnyObject | undefined | null;
export type AsyncValidateFunctionPromiseResult =
  Promise<AsyncValidateFunctionResult>;

export interface AsyncValidateHandle {
  (input: any, data: AnyObject):
    | AsyncValidateFunctionResult
    | AsyncValidateFunctionPromiseResult;
}

export type AsyncValidateOptionValue =
  | Symbol
  | AsyncValidateHandle
  | AsyncValidateHandle[]
  | AbstractAsyncValidate;

export interface AsyncValidateConfig {
  [field: string]: AsyncValidateOptionValue;
}
