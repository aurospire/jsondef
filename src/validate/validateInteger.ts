import { IntegerSchema } from "../Schema";
import { ValidationResult } from "./Context";
import { validateBounds } from "./validateBounds";

export const validateInteger = (value: any, schema: IntegerSchema, path: string[]): ValidationResult => {
    // Should this be .isSafeInteger or .isInteger?
    if (typeof value === 'number' && Number.isSafeInteger(value)) {

        const boundsCheck = validateBounds(value, schema, 'value');

        return boundsCheck ? [{ path, issue: boundsCheck }] : true;
    }

    return [{ path, issue: 'value must be integer.' }];
};
