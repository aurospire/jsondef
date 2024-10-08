import { TupleSchema } from "../Schema";
import { Context, ValidationResult } from "./Context";
import { SchemaValidator } from "./SchemaValidator";
import { Issue } from "../util/Result";
import { validateBounds } from "./validateBounds";

export const validateTuple = (value: any, schema: TupleSchema, path: string[], context: Context, validate: SchemaValidator): ValidationResult => {

    if (!Array.isArray(value)) return [{ on: path, message: 'value must be a tuple' }];

    const issues: Issue<string[]>[] = [];

    schema.of.forEach((item, i) => {
        const result = validate(value[i], item, [...path, i.toString()], context);

        if (result !== true) issues.push(...result);
    });

    if (schema.rest) {
        const boundsCheck = validateBounds(value.length - schema.of.length, schema.rest, 'value length');

        if (boundsCheck) return [{ on: path, message: boundsCheck }];

        for (let i = schema.of.length; i < value.length; i++) {
            const result = validate(value[i], schema.rest.of, [...path, i.toString()], context);

            if (result !== true) issues.push(...result);
        }
    }
    else {
        if (value.length !== schema.of.length)
            return [{ on: path, message: 'value has excess tuple elements' }];
    }

    return issues.length ? issues : true;
};
