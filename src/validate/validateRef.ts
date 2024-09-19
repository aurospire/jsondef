import { RefSchema } from "../Schema";
import { Context, ValidationResult } from "./Context";
import { SchemaValidator } from "./SchemaValidator";

export const validateRef = (value: any, ref: RefSchema, path: string[], context: Context, validate: SchemaValidator): ValidationResult => {
    if (!context.global) return [{ on: path, message: 'no global context' }];

    const referred = context.global[ref.of];

    return referred
        ? validate(value, referred, path, context)
        : [{ on: path, message: `ref: '${ref.of}' does not exist in global context` }];
};
