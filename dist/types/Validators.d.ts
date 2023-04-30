import { MobilePhoneLocale } from "validator/lib/isMobilePhone";
import { AsyncValidateHandle } from "./interface";
export declare class Validators {
    static and(validators: AsyncValidateHandle[], msg?: string): (input: any, data: any) => Promise<{
        [x: string]: string | boolean;
    } | null>;
    static or(validators: AsyncValidateHandle[], msg?: string): (input: any, data: any) => Promise<{
        [x: string]: string | boolean;
    } | null>;
    static required(msg?: string): AsyncValidateHandle;
    static len(size: number, msg?: string): AsyncValidateHandle;
    static minLength(len: number, msg?: string): AsyncValidateHandle;
    static maxLength(len: number, msg?: string): AsyncValidateHandle;
    static phone(msg?: string, locale?: MobilePhoneLocale): AsyncValidateHandle;
    static bool(msg?: string): AsyncValidateHandle;
    static ipv4(msg?: string): AsyncValidateHandle;
    static ipv6(msg?: string): AsyncValidateHandle;
    static url(msg?: string): AsyncValidateHandle;
    static email(msg?: string): AsyncValidateHandle;
    static max(max: number, msg?: string): AsyncValidateHandle;
    static min(min: number, msg?: string): AsyncValidateHandle;
    static hex(msg?: string): AsyncValidateHandle;
    static number(msg?: string): AsyncValidateHandle;
    static int(msg?: string): AsyncValidateHandle;
    static array(msg?: string): AsyncValidateHandle;
    static object(msg?: string): AsyncValidateHandle;
    static json(msg?: string): AsyncValidateHandle;
    static regexp(msg?: string): AsyncValidateHandle;
    static string(msg?: string): AsyncValidateHandle;
}
//# sourceMappingURL=Validators.d.ts.map