import { RecordSchema } from "../Schema";
import { isObject, RegexString } from "../util";
import { Context, ValidationResult } from "./Context";
import { Issue } from "./Result";
import { SchemaValidator } from "./SchemaValidator";
import { validateBounds } from "./validateBounds";
import { validateString } from "./validateString";

export const validateRecord = (value: any, schema: RecordSchema, path: string[], context: Context, validate: SchemaValidator): ValidationResult => {

    if (!isObject(value)) return [{ path, issue: 'value must be an object' }];

    const issues: Issue[] = [];

    const entries = Object.entries(value);


    const boundsCheck = validateBounds(entries.length, schema, 'value length');

    if (boundsCheck) issues.push({ path, issue: boundsCheck });


    let regex: RegExp | undefined;


    entries.forEach(([itemKey, itemValue]) => {
        const itemPath = [...path, itemKey];

        if (schema.key) {
            const keycheck = validateString(itemKey, schema.key, path, 'key');

            if (keycheck !== true)
                issues.push(...keycheck);
        }

        const valueCheck = validate(itemValue, schema.of, itemPath, context);

        if (valueCheck !== true) issues.push(...valueCheck);
    });

    return issues.length ? issues : true;
};
