import { validateBounds } from "./validateBounds";
import { NumberSchema } from "../Schema";
import { ValidationResult } from "./Context";

export const validateNumber = (value: any, schema: NumberSchema, path: string[]): ValidationResult => {
    if (typeof value === 'number' && Number.isFinite(value)) {

        const boundsCheck = validateBounds(value, schema, 'value');

        return boundsCheck ? [{ path, issue: boundsCheck }] : true;
    }

    return [{ path, issue: 'value must be number.' }];
};
