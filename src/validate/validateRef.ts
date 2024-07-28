import { RefSchema } from "../Schema";
import { Context, ValidationResult } from "./Context";
import { SchemaValidator } from "./SchemaValidator";

export const validateRef = (value: any, ref: RefSchema, path: string[], context: Context, validate: SchemaValidator): ValidationResult => {
    if (!context.global) return [{ path, issue: 'no global context' }];

    const referred = context.global[ref.of];

    return referred
        ? validate(value, referred, path, context)
        : [{ path, issue: `ref: '${ref.of}' does not exist in global context` }];
};
