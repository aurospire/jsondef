import { RecordSchema } from "../Schema";
import { isObject, RegexString } from "../util";
import { Context, ValidationResult } from "./Context";
import { Issue } from "./Result";
import { SchemaValidator } from "./SchemaValidator";
import { validateBounds } from "./validateBounds";

export const validateRecord = (value: any, schema: RecordSchema, path: string[], context: Context, validate: SchemaValidator): ValidationResult => {

    if (!isObject(value)) return [{ path, issue: 'value must be an object' }];

    const issues: Issue[] = [];

    const entries = Object.entries(value);


    const boundsCheck = validateBounds(entries.length, schema, 'value length');

    if (boundsCheck) issues.push({ path, issue: boundsCheck });


    let regex: RegExp | undefined;

    if (schema.key) {
        regex = schema.key instanceof RegExp ? schema.key : RegexString.toRegExp(schema.key);

        if (!regex)
            issues.push({ path, issue: 'invalid key filter' });
    }

    entries.forEach(([itemKey, itemValue]) => {
        const itemPath = [...path, itemKey];

        if (regex) {
            if (!regex.test(itemKey))
                issues.push({ path, issue: 'key does not match filter' });
        }

        const valueCheck = validate(itemValue, schema.of, itemPath, context);

        if (valueCheck !== true) issues.push(...valueCheck);
    });

    return issues.length ? issues : true;
};
