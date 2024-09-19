import { SchemaObject } from "../Schema";
import { Context, ValidationResult } from "./Context";
import { SchemaValidator } from "./SchemaValidator";
import { isObject } from "../util";
import { Issue } from "../util/Result";

export const validateObject = (
    value: any,
    schemas: SchemaObject,
    path: string[],
    context: Context,
    validate: SchemaValidator,
    optionals: boolean = false
): ValidationResult => {
    if (!isObject(value)) return [{ on: path, message: 'value must be an object' }];

    const names = new Set<string>(Object.keys(value));

    const issues: Issue<string[]>[] = [];

    Object.entries(schemas).forEach(([schemaKey, schema]) => {
        const schemaPath = [...path, schemaKey];

        if (names.has(schemaKey)) {

            names.delete(schemaKey);

            const itemValue = value[schemaKey];

            const result = validate(itemValue, schema, schemaPath, context);

            if (result !== true) issues.push(...result);
        }
        else if (!optionals || !schema.isOptional) {
            issues.push({ on: schemaPath, message: `missing key '${schemaKey}'` });
        }
    });

    if (names.size) issues.push({ on: path, message: `has excess keys: [${[...names].join(', ')}]` });

    return issues.length ? issues : true;
};
