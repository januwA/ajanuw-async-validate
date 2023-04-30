import { AnyObject } from "./interface";


export abstract class AbstractAsyncValidateResult {
  /**
   * errors = { username: { required: "", len: "" }, paddworld: { len: "" } }
   */
  readonly errors?: {
    [field: string]: AnyObject;
  };
}
