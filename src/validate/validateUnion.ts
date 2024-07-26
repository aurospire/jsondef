import { UnionField } from "../Field";
import { Context, ValidationResult } from "./Context";
import { FieldValidator } from "./FieldValidator";
import { Issue } from "./Result";

export const validateUnion = (value: any, union: UnionField, path: string[], context: Context, validate: FieldValidator): ValidationResult => {
    const issues: Issue[] = [];

    for (const option of union.of) {
        const optionResult = validate(value, option, path, context);

        if (optionResult === true) return true;

        issues.push(...optionResult);
    }

    return issues;
};
