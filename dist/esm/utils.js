export function firstErrorMsg(result) {
    if (result.errors && Object.keys(result.errors).length) {
        const fErrors = Object.values(result.errors)[0];
        const msgs = Object.values(fErrors);
        return msgs[0];
    }
}
export function handleValidators(validators) {
    if (!validators)
        return [];
    if (typeof validators === "function")
        return [validators];
    if (Array.isArray(validators))
        return validators;
    return [];
}
export async function checkValue(keyValidate, value, data) {
    let errors = [];
    for (const h of handleValidators(keyValidate)) {
        const error = await h(value, data);
        if (error)
            errors.push(error);
    }
    return errors;
}
export function makeValidatorError(errCode, msg) {
    return { [errCode]: msg ? msg : true };
}
