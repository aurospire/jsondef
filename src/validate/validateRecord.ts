import { RecordField } from "../Field";
import { Context, ValidationResult } from "./Context";
import { FieldValidator } from "./FieldValidator";
import { isObject } from "./isObject";
import { Issue } from "./Result";
import { validateBounds } from "./validateBounds";
import { validateString } from "./validateString";

export const validateRecord = (value: any, field: RecordField, path: string[], context: Context, validate: FieldValidator): ValidationResult => {

    if (!isObject(value)) return [{ path, issue: 'value must be an object' }];

    const issues: Issue[] = [];

    const entries = Object.entries(value);

    const boundsCheck = validateBounds(entries.length, field, 'value length');

    if (boundsCheck) issues.push({ path, issue: boundsCheck });

    const valueField = field.of || { kind: 'any' };

    entries.forEach(([itemKey, itemValue]) => {
        const itemPath = [...path, itemKey];

        if (field.key) {
            const keyCheck = validateString(itemKey, field.key, itemPath);

            if (keyCheck !== true) issues.push(...keyCheck);
        }

        const valueCheck = validate(itemValue, valueField, itemPath, context);

        if (valueCheck !== true) issues.push(...valueCheck);
    });

    return issues.length ? issues : true;
};
