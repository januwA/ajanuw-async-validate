import { AsyncValidateResult } from "./AsyncValidateResult";
import { AnyObject } from "./interface";

export abstract class AbstractAsyncValidate {
  name = "";
  setName(name: string): void {
    this.name = name;
  }
  abstract validate(
    data: AnyObject,
    checkAll: boolean
  ): Promise<AsyncValidateResult>;
}
