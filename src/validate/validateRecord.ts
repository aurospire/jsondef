import { RecordSchema } from "../Schema";
import { Context, ValidationResult } from "./Context";
import { SchemaValidator } from "./SchemaValidator";
import { isObject } from "./isObject";
import { Issue } from "./Result";
import { validateBounds } from "./validateBounds";
import { validateString } from "./validateString";

export const validateRecord = (value: any, schema: RecordSchema, path: string[], context: Context, validate: SchemaValidator): ValidationResult => {

    if (!isObject(value)) return [{ path, issue: 'value must be an object' }];

    const issues: Issue[] = [];

    const entries = Object.entries(value);

    const boundsCheck = validateBounds(entries.length, schema, 'value length');

    if (boundsCheck) issues.push({ path, issue: boundsCheck });

    const valueSchema = schema.of || { kind: 'any' };

    entries.forEach(([itemKey, itemValue]) => {
        const itemPath = [...path, itemKey];

        if (schema.key) {
            const keyCheck = validateString(itemKey, schema.key, itemPath);

            if (keyCheck !== true) issues.push(...keyCheck);
        }

        const valueCheck = validate(itemValue, valueSchema, itemPath, context);

        if (valueCheck !== true) issues.push(...valueCheck);
    });

    return issues.length ? issues : true;
};
