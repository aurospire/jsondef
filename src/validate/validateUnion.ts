import { UnionSchema } from "../Schema";
import { Context, ValidationResult } from "./Context";
import { SchemaValidator } from "./SchemaValidator";
import { Issue } from "../util/Result";

export const validateUnion = (value: any, union: UnionSchema, path: string[], context: Context, validate: SchemaValidator): ValidationResult => {
    const issues: Issue<string[]>[] = [];

    for (const option of union.of) {
        const optionResult = validate(value, option, path, context);

        if (optionResult === true) return true;

        issues.push(...optionResult);
    }

    return issues;
};
