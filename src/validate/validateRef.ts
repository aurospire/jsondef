import { RefField } from "../Field";
import { Context, ValidationResult } from "./Context";
import { FieldValidator } from "./FieldValidator";

export const validateRef = (value: any, ref: RefField, path: string[], context: Context, validate: FieldValidator): ValidationResult => {
    if (!context.global) return [{ path, issue: 'no global context' }];

    const referred = context.global[ref.of];

    return referred
        ? validate(value, referred, path, context)
        : [{ path, issue: `ref: '${ref.of}' does not exist in global context` }];
};
