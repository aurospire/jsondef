import { GroupField } from "../Field";
import { Context, ValidationResult, makeContext } from "./Context";
import { FieldValidator } from "./FieldValidator";
import { validateObject } from "./validateObject";

export const validateGroup = (value: any, group: GroupField, path: string[], context: Context, validate: FieldValidator): ValidationResult => {
    if (group.selected) {

        const selected = group.of[group.selected];

        return selected
            ? validate(value, selected, path, makeContext(context.cache, group.of))
            : [{ path, issue: `selection '${group.selected}' does not exist in group` }];
    }
    else {
        return validateObject(value, group.of, path, makeContext(context.cache), validate, false);
    }
};
