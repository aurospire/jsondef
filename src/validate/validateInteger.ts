import { IntegerField } from "../Field";
import { ValidationResult } from "./Context";
import { validateBounds } from "./validateBounds";

export const validateInteger = (value: any, field: IntegerField, path: string[]): ValidationResult => {
    if (typeof value === 'number' && Number.isInteger(value)) {

        const boundsCheck = validateBounds(value, field, 'value');

        return boundsCheck ? [{ path, issue: boundsCheck }] : true;
    }

    return [{ path, issue: 'value must be integer.' }];
};
