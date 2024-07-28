import { TupleField } from "../Field";
import { Context, ValidationResult } from "./Context";
import { FieldValidator } from "./FieldValidator";
import { Issue } from "./Result";
import { validateBounds } from "./validateBounds";

export const validateTuple = (value: any, field: TupleField, path: string[], context: Context, validate: FieldValidator): ValidationResult => {

    if (!Array.isArray(value)) return [{ path, issue: 'value must be a tuple' }];

    const issues: Issue[] = [];

    field.of.forEach((item, i) => {
        const result = validate(value[i], item, [...path, i.toString()], context);

        if (result !== true) issues.push(...result);
    });

    if (field.rest) {
        const boundsCheck = validateBounds(value.length - field.of.length, field.rest, 'value length');

        if (boundsCheck) return [{ path, issue: boundsCheck }];

        for (let i = field.of.length; i < value.length; i++) {
            const result = validate(value[i], field.rest, [...path, i.toString()], context);

            if (result !== true) issues.push(...result);
        }
    }

    return issues.length ? issues : true;
};
