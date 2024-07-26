import { ArrayField, BoundedAttributes, Field, FieldObject, GroupField, IntegerField, LiteralField, ModelField, NumberField, ObjectField, RecordField, RefField, StringField, TupleField, UnionField } from "../Field";
import { InferField } from "../Infer";
import { makeContext, Context, ValidationResult, newResultCache } from "./Context";
import { isObject } from "./isObject";
import { Issue, Result } from "./Result";
import { validateAny } from "./validateAny";

export const validate = <const F extends Field>(value: any, field: F): Result<InferField<F>> => {
    const result = validateField(value, field, [], makeContext());
    return result === true ? Result.success(value) : Result.failure(result);
};

export const validateField = (value: any, field: Field, path: string[], context: Context): ValidationResult => {
    let resultCache = context.cache.get(field) || newResultCache();
    context.cache.set(field, resultCache);

    const cachedValue = resultCache.get(value);
    if (cachedValue) return cachedValue;

    let result: ValidationResult;

    switch (field.kind) {
        case "any": result = validateAny(value, path); break;
        case "null": result = value === null ? true : [{ path, issue: 'value must be null' }]; break;
        case "boolean": result = typeof value === 'boolean' ? true : [{ path, issue: 'value must be boolean' }]; break;
        case "literal": result = value === (field as LiteralField).of ? true : [{ path, issue: `value must be ${(field as LiteralField).of}` }]; break;
        case "integer": result = validateInteger(value, field as IntegerField, path); break;
        case "number": result = validateNumber(value, field as NumberField, path); break;
        case "string": result = validateString(value, field as StringField, path); break;
        case "array": result = validateArray(value, field as ArrayField, path, context); break;
        case "tuple": result = validateTuple(value, field as TupleField, path, context); break;
        case "record": result = validateRecord(value, field as RecordField, path, context); break;
        case "object": result = validateObject(value, (field as ObjectField).of, path, makeContext(context.cache, context.global, context.root, field as ObjectField), true); break;
        case "model": result = validateObject(value, (field as ModelField).of, path, makeContext(context.cache, context.global, field as ModelField, field as ModelField), true); break;
        case "group": result = validateGroup(value, field as GroupField, path, context); break;
        case "union": result = validateUnion(value, field as UnionField, path, context); break;
        case "this": result = context.local ? validateField(value, context.local, path, context) : [{ path, issue: 'no local field' }]; break;
        case "root": result = context.root ? validateField(value, context.root, path, context) : [{ path, issue: 'no root field' }]; break;
        case "ref": result = validateRef(value, field as RefField, path, context); break;
        default: result = [{ path, issue: `invalid field kind: '${(field as Field).kind}'` }];
    }

    resultCache.set(value, result);
    return result;
};

const validateBounds = (value: number, field: BoundedAttributes, prefix: string): string | undefined => {
    const { xmin, min, xmax, max } = field;
    if ((xmin !== undefined && value <= xmin) || (min !== undefined && value < min)) {
        const bound = xmin !== undefined ? xmin : min;
        const operator = xmin !== undefined ? ">" : "≥";
        return `${prefix} must be ${operator} ${bound}.`;
    }

    if ((xmax !== undefined && value >= xmax) || (max !== undefined && value > max)) {
        const bound = xmax !== undefined ? xmax : max;
        const operator = xmax !== undefined ? "<" : "≤";
        return `${prefix} must be ${operator} ${bound}.`;
    }

    return undefined;
};

const validateInteger = (value: any, field: IntegerField, path: string[]): ValidationResult => {
    if (typeof value === 'number' && Number.isInteger(value)) {
        const boundsCheck = validateBounds(value, field, 'value');
        return boundsCheck ? [{ path, issue: boundsCheck }] : true;
    }
    return [{ path, issue: 'value must be integer.' }];
};

const validateNumber = (value: any, field: NumberField, path: string[]): ValidationResult => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        const boundsCheck = validateBounds(value, field, 'value');
        return boundsCheck ? [{ path, issue: boundsCheck }] : true;
    }
    return [{ path, issue: 'value must be number.' }];
};

const STRING_FILTERS = {
    date: /^(\d{4})-(\d{2})-(\d{2})$/,
    time: /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/,
    datetime: /^(\d{4})-(\d{2})-(\d{2})T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    base64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
};

const validateString = (value: any, field: StringField, path: string[]): ValidationResult => {
    if (typeof value !== 'string') return [{ path, issue: 'value must be string.' }];

    const { of: filter } = field;
    if (filter) {
        if (typeof filter === 'string') {
            const regex = STRING_FILTERS[filter as keyof typeof STRING_FILTERS];
            if (regex && !regex.test(value)) {
                return [{ path, issue: `value must be a ${filter} string` }];
            }
        } else if (filter instanceof RegExp) {
            if (!filter.test(value)) {
                return [{ path, issue: `value must match custom regex: ${filter}` }];
            }
        } else {
            return [{ path, issue: `invalid string filter ${filter}` }];
        }
    }

    const boundsCheck = validateBounds(value.length, field, 'value length');
    return boundsCheck ? [{ path, issue: boundsCheck }] : true;
};

const validateArray = (value: any, array: ArrayField, path: string[], context: Context): ValidationResult => {
    if (!Array.isArray(value)) return [{ path, issue: 'value must be an array' }];

    const boundsCheck = validateBounds(value.length, array, 'value length');
    if (boundsCheck) return [{ path, issue: boundsCheck }];

    const issues: Issue[] = [];
    for (let i = 0; i < value.length; i++) {
        const result = validateField(value[i], array.of, [...path, i.toString()], context);
        if (result !== true) issues.push(...result);
    }
    return issues.length ? issues : true;
};

const validateTuple = (value: any, field: TupleField, path: string[], context: Context): ValidationResult => {
    if (!Array.isArray(value)) return [{ path, issue: 'value must be a tuple' }];

    const boundsCheck = validateBounds(value.length, field, 'value length');
    if (boundsCheck) return [{ path, issue: boundsCheck }];

    const issues: Issue[] = [];
    field.of.forEach((item, i) => {
        const result = validateField(value[i], item, [...path, i.toString()], context);
        if (result !== true) issues.push(...result);
    });

    if (field.rest) {
        for (let i = field.of.length; i < value.length; i++) {
            const result = validateField(value[i], field.rest, [...path, i.toString()], context);
            if (result !== true) issues.push(...result);
        }
    }

    return issues.length ? issues : true;
};

const validateRecord = (value: any, field: RecordField, path: string[], context: Context): ValidationResult => {
    if (!isObject(value)) return [{ path, issue: 'value must be an object' }];

    const issues: Issue[] = [];
    const entries = Object.entries(value);

    const boundsCheck = validateBounds(entries.length, field, 'value length');
    if (boundsCheck) issues.push({ path, issue: boundsCheck });

    const valueField = field.of || { kind: 'any' };

    entries.forEach(([itemKey, itemValue]) => {
        const itemPath = [...path, itemKey];
        if (field.key) {
            const keyCheck = validateString(itemKey, field.key, itemPath);
            if (keyCheck !== true) issues.push(...keyCheck);
        }
        const valueCheck = validateField(itemValue, valueField, itemPath, context);
        if (valueCheck !== true) issues.push(...valueCheck);
    });

    return issues.length ? issues : true;
};

const validateObject = (
    value: any,
    fields: FieldObject,
    path: string[],
    context: Context,
    optionals: boolean = false
): ValidationResult => {
    if (!isObject(value)) return [{ path, issue: 'value must be an object' }];

    const names = new Set<string>(Object.keys(value));
    const issues: Issue[] = [];

    Object.entries(fields).forEach(([fieldKey, field]) => {
        const fieldPath = [...path, fieldKey];
        if (names.has(fieldKey)) {
            names.delete(fieldKey);
            const itemValue = value[fieldKey];
            const result = validateField(itemValue, field, fieldPath, context);
            if (result !== true) issues.push(...result);
        } else if (!optionals || !field.isOptional) {
            issues.push({ path: fieldPath, issue: `missing key '${fieldKey}'` });
        }
    });

    if (names.size) issues.push({ path, issue: `has excess keys: [${[...names].join(', ')}]` });

    return issues.length ? issues : true;
};

const validateGroup = (value: any, group: GroupField, path: string[], context: Context): ValidationResult => {
    if (group.selected) {
        const selected = group.of[group.selected];
        return selected
            ? validateField(value, selected, path, makeContext(context.cache, group.of))
            : [{ path, issue: `selection '${group.selected}' does not exist in group` }];
    }
    return validateObject(value, group.of, path, makeContext(context.cache), false);
};

const validateUnion = (value: any, union: UnionField, path: string[], context: Context): ValidationResult => {
    const issues: Issue[] = [];
    for (const option of union.of) {
        const optionResult = validateField(value, option, path, context);
        if (optionResult === true) return true;
        issues.push(...optionResult);
    }
    return issues;
};

const validateRef = (value: any, ref: RefField, path: string[], context: Context): ValidationResult => {
    if (!context.global) return [{ path, issue: 'no global context' }];
    const selected = context.global[ref.of];
    return selected
        ? validateField(value, selected, path, context)
        : [{ path, issue: `ref: '${ref.of}' does not exist in global context` }];
};