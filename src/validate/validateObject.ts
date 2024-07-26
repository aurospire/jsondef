import { FieldObject } from "../Field";
import { Context, ValidationResult } from "./Context";
import { FieldValidator } from "./FieldValidator";
import { isObject } from "./isObject";
import { Issue } from "./Result";

export const validateObject = (
    value: any,
    fields: FieldObject,
    path: string[],
    context: Context,
    validate: FieldValidator,
    optionals: boolean = false
): ValidationResult => {
    if (!isObject(value)) return [{ path, issue: 'value must be an object' }];

    const names = new Set<string>(Object.keys(value));

    const issues: Issue[] = [];

    Object.entries(fields).forEach(([fieldKey, field]) => {
        const fieldPath = [...path, fieldKey];

        if (names.has(fieldKey)) {

            names.delete(fieldKey);

            const itemValue = value[fieldKey];

            const result = validate(itemValue, field, fieldPath, context);

            if (result !== true) issues.push(...result);
        }
        else if (!optionals || !field.isOptional) {
            issues.push({ path: fieldPath, issue: `missing key '${fieldKey}'` });
        }
    });

    if (names.size) issues.push({ path, issue: `has excess keys: [${[...names].join(', ')}]` });

    return issues.length ? issues : true;
};
