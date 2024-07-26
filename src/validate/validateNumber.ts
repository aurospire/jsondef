import { validateBounds } from "./validateBounds";
import { NumberField } from "../Field";
import { ValidationResult } from "./Context";

export const validateNumber = (value: any, field: NumberField, path: string[]): ValidationResult => {
    if (typeof value === 'number' && Number.isFinite(value)) {

        const boundsCheck = validateBounds(value, field, 'value');

        return boundsCheck ? [{ path, issue: boundsCheck }] : true;
    }

    return [{ path, issue: 'value must be number.' }];
};
