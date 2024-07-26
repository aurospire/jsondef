import { Field, LiteralField, IntegerField, NumberField, StringField, ArrayField, TupleField, RecordField, ObjectField, ModelField, GroupField, UnionField, RefField } from "../Field";
import { Context, ValidationResult, newResultCache, makeContext } from "./Context";
import { FieldValidator } from "./FieldValidator";
import { validateAny } from "./validateAny";
import { validateArray } from "./validateArray";
import { validateGroup } from "./validateGroup";
import { validateInteger } from "./validateInteger";
import { validateNumber } from "./validateNumber";
import { validateObject } from "./validateObject";
import { validateRecord } from "./validateRecord";
import { validateRef } from "./validateRef";
import { validateString } from "./validateString";
import { validateTuple } from "./validateTuple";
import { validateUnion } from "./validateUnion";


export const validateField: FieldValidator = (value: any, field: Field, path: string[], context: Context): ValidationResult => {
    let resultCache = context.cache.get(field);

    if (resultCache) {
        const cachedValue = resultCache.get(value);
        if (cachedValue) return cachedValue;
    }
    else {
        resultCache = newResultCache();
        context.cache.set(field, resultCache);
    }

    let result: ValidationResult;

    switch (field.kind) {
        case "any":
            result = validateAny(value, path);
            break;

        case "null":
            result = value === null ? true : [{ path, issue: 'value must be null' }];
            break;

        case "boolean":
            result = typeof value === 'boolean' ? true : [{ path, issue: 'value must be boolean' }];
            break;

        case "literal":
            result = value === (field as LiteralField).of ? true : [{ path, issue: `value must be ${(field as LiteralField).of}` }];
            break;

        case "integer":
            result = validateInteger(value, field as IntegerField, path);
            break;

        case "number":
            result = validateNumber(value, field as NumberField, path);
            break;

        case "string":
            result = validateString(value, field as StringField, path);
            break;

        case "array":
            result = validateArray(value, field as ArrayField, path, context, validateField);
            break;

        case "tuple":
            result = validateTuple(value, field as TupleField, path, context, validateField);
            break;

        case "record":
            result = validateRecord(value, field as RecordField, path, context, validateField);
            break;

        case "object":
            result = validateObject(value, (field as ObjectField).of, path,
                makeContext(context.cache, context.global, context.root, field as ObjectField), validateField, true);
            break;

        case "model":
            result = validateObject(value, (field as ModelField).of, path,
                makeContext(context.cache, context.global, field as ModelField, field as ModelField), validateField, true);
            break;

        case "group":
            result = validateGroup(value, field as GroupField, path, context, validateField);
            break;

        case "union":
            result = validateUnion(value, field as UnionField, path, context, validateField);
            break;

        case "this":
            result = context.local ? validateField(value, context.local, path, context) : [{ path, issue: 'no local field' }];
            break;

        case "root":
            result = context.root ? validateField(value, context.root, path, context) : [{ path, issue: 'no root field' }];
            break;

        case "ref":
            result = validateRef(value, field as RefField, path, context, validateField);
            break;

        default:
            result = [{
                path, issue: `invalid field kind: '${(field as Field).kind}
            '`
            }];

    }

    resultCache.set(value, result);

    return result;
};
