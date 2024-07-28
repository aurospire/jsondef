import { ValidationResult } from "./Context";
import { isObject } from "./isObject";
import { Issue } from "./Result";

export const validateAny = (value: any, path: string[]): ValidationResult => {
    if (value === null)
        return true;
    else if (typeof value === 'boolean')
        return true;
    else if (typeof value === 'string')
        return true;
    else if (typeof value === 'number')
        return Number.isFinite(value) ? true : [{ path, issue: 'not a valid number' }];
    else if (Array.isArray(value))
        return validateArrayItems(value, path);
    else if (isObject(value))
        return validateObjectProperties(value, path);

    else
        return [{ path, issue: 'not a valid type' }];
};

const validateArrayItems = (value: any[], path: string[]): ValidationResult => {
    const issues: Issue[] = [];

    for (let i = 0; i < value.length; i++) {
        const result = validateAny(value[i], [...path, i.toString()]);

        if (result !== true) issues.push(...result);
    }

    return issues.length ? issues : true;
};

const validateObjectProperties = (value: Object, path: string[]): ValidationResult => {
    const issues: Issue[] = [];

    for (const [itemKey, itemValue] of Object.entries(value)) {
        const result = validateAny(itemValue, [...path, itemKey]);

        if (result !== true) issues.push(...result);
    }
    return issues.length ? issues : true;
};
