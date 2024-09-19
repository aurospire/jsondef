import { validateBounds } from "./validateBounds";
import { NumberSchema } from "../Schema";
import { ValidationResult } from "./Context";

export const validateNumber = (value: any, schema: NumberSchema, path: string[]): ValidationResult => {
    if (typeof value === 'number' && Number.isFinite(value)) {

        const boundsCheck = validateBounds(value, schema, 'value');

        return boundsCheck ? [{ on: path, message: boundsCheck }] : true;
    }

    return [{ on: path, message: 'value must be number.' }];
};
