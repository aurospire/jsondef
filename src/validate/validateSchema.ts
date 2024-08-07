import { Schema, LiteralSchema, IntegerSchema, NumberSchema, StringSchema, ArraySchema, TupleSchema, RecordSchema, ObjectSchema, ModelSchema, GroupSchema, UnionSchema, RefSchema } from "../Schema";
import { Context, ValidationResult, newResultCache, makeContext } from "./Context";
import { SchemaValidator } from "./SchemaValidator";
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


export const validateSchema: SchemaValidator = (value: any, schema: Schema, path: string[], context: Context): ValidationResult => {
    let resultCache = context.cache.get(schema);

    if (resultCache) {
        const cachedValue = resultCache.get(value);
        if (cachedValue) return cachedValue;
    }
    else {
        resultCache = newResultCache();
        context.cache.set(schema, resultCache);
    }

    // Set so if we encounter it again, it will return true
    resultCache.set(value, true);

    let result: ValidationResult;

    switch (schema.kind) {
        case "any":
            result = validateAny(value, path);
            break;

        case "null":
            result = value === null ? true : [{ on: path, message: 'value must be null' }];
            break;

        case "boolean":
            result = typeof value === 'boolean' ? true : [{ on: path, message: 'value must be boolean' }];
            break;

        case "literal":
            result = value === (schema as LiteralSchema).of ? true : [{ on: path, message: `value must be ${(schema as LiteralSchema).of}` }];
            break;

        case "integer":
            result = validateInteger(value, schema as IntegerSchema, path);
            break;

        case "number":
            result = validateNumber(value, schema as NumberSchema, path);
            break;

        case "string":
            result = validateString(value, schema as StringSchema, path);
            break;

        case "array":
            result = validateArray(value, schema as ArraySchema, path, context, validateSchema);
            break;

        case "tuple":
            result = validateTuple(value, schema as TupleSchema, path, context, validateSchema);
            break;

        case "record":
            result = validateRecord(value, schema as RecordSchema, path, context, validateSchema);
            break;

        case "object":
            result = validateObject(value, (schema as ObjectSchema).of, path,
                makeContext(context.cache, context.global, context.root || schema as ObjectSchema, schema as ObjectSchema), validateSchema, true);
            break;

        case "model":
            result = validateObject(value, (schema as ModelSchema).of, path,
                makeContext(context.cache, context.global, schema as ModelSchema, schema as ModelSchema), validateSchema, true);
            break;

        case "group":
            result = validateGroup(value, schema as GroupSchema, path, context, validateSchema);
            break;

        case "union":
            result = validateUnion(value, schema as UnionSchema, path, context, validateSchema);
            break;

        case "this":
            result = context.local ? validateSchema(value, context.local, path, context) : [{ on: path, message: 'no local schema' }];
            break;

        case "root":
            result = context.root ? validateSchema(value, context.root, path, context) : [{ on: path, message: 'no root schema' }];
            break;

        case "ref":
            result = validateRef(value, schema as RefSchema, path, context, validateSchema);
            break;

        default:
            result = [{
                on: path, message: `invalid schema kind: '${(schema as Schema).kind}
            '`
            }];

    }

    // set with actual result
    resultCache.set(value, result);

    return result;
};
