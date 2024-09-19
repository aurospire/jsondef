import { GroupSchema } from "../Schema";
import { Context, ValidationResult, makeContext } from "./Context";
import { SchemaValidator } from "./SchemaValidator";
import { validateObject } from "./validateObject";

export const validateGroup = (value: any, group: GroupSchema, path: string[], context: Context, validate: SchemaValidator): ValidationResult => {
    if (group.selected) {

        const selected = group.of[group.selected];

        return selected
            ? validate(value, selected, path, makeContext(context.cache, group.of))
            : [{ on: path, message: `selection '${group.selected}' does not exist in group` }];
    }
    else {
        return validateObject(value, group.of, path, makeContext(context.cache), validate, false);
    }
};
