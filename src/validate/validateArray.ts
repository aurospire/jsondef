import { ArraySchema } from "../Schema";
import { Context, ValidationResult } from "./Context";
import { SchemaValidator } from "./SchemaValidator";
import { Issue } from "../util/Result";
import { validateBounds } from "./validateBounds";

export const validateArray = (value: any, array: ArraySchema, path: string[], context: Context, validate: SchemaValidator): ValidationResult => {

    if (!Array.isArray(value)) return [{ on: path, message: 'value must be an array' }];

    const boundsCheck = validateBounds(value.length, array, 'value length');

    if (boundsCheck) return [{ on: path, message: boundsCheck }];

    const issues: Issue<string[]>[] = [];

    for (let i = 0; i < value.length; i++) {
        const result = validate(value[i], array.of, [...path, i.toString()], context);

        if (result !== true) issues.push(...result);
    }

    return issues.length ? issues : true;
};
