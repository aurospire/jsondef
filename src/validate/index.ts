import { ArrayField, BoundedAttributes, Field, FieldObject, GroupField, IntegerField, LiteralField, ModelField, NumberField, ObjectField, RecordField, RefField, StringField, TupleField, UnionField } from "../Field";
import { InferField } from "../Infer";

export type Issue = {
    path: string[];
    issue: string;
};

export type ResultSuccess<T> = { success: true, value: T; };

export type ResultFailure = { success: false, issues: Issue[]; };

export type Result<T> = ResultSuccess<T> | ResultFailure;

export const Result = Object.freeze({
    success: <T>(value: T): ResultSuccess<T> => ({ success: true, value }),
    failure: (issues: Issue[]): ResultFailure => ({ success: false, issues })
});


export const validate = <const F extends Field>(value: any, field: F): Result<InferField<F>> => {
    const result = validateField(value, field, []);

    return result !== true ? Result.failure(result) : Result.success(value);
};


type ValidationResult = true | Issue[];

const validateField = <const F extends Field>(
    value: any,
    field: Field,
    path: string[],
    cache: Map<Field, Map<any, ValidationResult>> = new Map<Field, Map<any, ValidationResult>>(),
    global?: FieldObject,
    root?: ModelField | ObjectField,
    local?: ModelField | ObjectField
): ValidationResult => {

    let fieldCache = cache.get(field);
    if (fieldCache) {
        const cachedValue = fieldCache.get(value);
        if (cachedValue) return cachedValue;
    }
    else {
        fieldCache = new Map<any, ValidationResult>();
        cache.set(field, fieldCache);
    }

    let result: ValidationResult = true;

    switch (field.kind) {
        /* TERMINALS */
        case "any": {
            // TODO: go through all fields/subfield make sure only valid JSON types
            result = true;
            break;
        }
        case "null": {
            result = value === null ? true : [{ path, issue: 'value must be null' }];
            break;
        }
        case "boolean": {
            result = typeof value === 'boolean' ? true : [{ path, issue: 'value must be boolean' }];
            break;
        }
        case "literal": {
            const literal = field as LiteralField;
            result = value === literal.of ? true : [{ path, issue: `value must be ${literal.of}` }];
            break;
        }
        case "integer": {
            result = validateInteger(value, field as IntegerField, path);
            break;
        }

        case "number": {
            result = validateNumber(value, field as NumberField, path);
            break;
        }

        case "string": {
            result = validateString(value, field as StringField, path);
            break;
        }


        case "array": {
            if (Array.isArray(value)) {
                const array = field as ArrayField;

                const boundsCheck = validateBounds(value.length, array, 'value length');

                if (boundsCheck) {
                    result = [{ path, issue: boundsCheck }];
                }
                else {
                    let issues: Issue[] = [];

                    for (let i = 0; i <= value.length; i++) {
                        const result = validateField(value, array.of, [...path, i.toString()], cache, global, root, local);

                        if (result !== true)
                            issues.push(...result);
                    }

                    result = issues.length ? issues : true;
                }
            }
            else {
                result = [{ path, issue: 'value must be an array' }];
            }
            break;
        }

        case "tuple": {
            if (Array.isArray(value)) {
                const tuple = field as TupleField;

                const boundsCheck = validateBounds(value.length, tuple, 'value length');

                if (boundsCheck) {
                    result = [{ path, issue: boundsCheck }];
                }
                else {
                    const issues: Issue[] = [];

                    let i = 0;

                    for (const item of tuple.of) {
                        const result = validateField(value, item, [...path, i.toString()], cache, global, root, local);

                        if (result !== true) issues.push(...result);

                        i++;
                    }

                    if (tuple.rest) {
                        while (i < value.length) {
                            const result = validateField(value, tuple.rest, [...path, i.toString()], cache, global, root, local);

                            if (result !== true) issues.push(...result);

                            i++;
                        }
                    }

                    result = issues.length ? issues : true;
                }
            }
            else {
                result = [{ path, issue: 'value must be a tuple' }];
            }
            break;
        }

        case "record": {
            if (Object.getPrototypeOf(value ?? true) === Object.prototype) {
                const record = field as RecordField;

                const issues: Issue[] = [];

                const entries = Object.entries(value);

                const boundsCheck = validateBounds(entries.length, record, 'value length');

                if (boundsCheck)
                    issues.push({ path, issue: boundsCheck });

                const valueField = record.of || ({ kind: 'any' });

                if (record.key) {
                    for (const [itemKey, itemValue] of entries) {
                        const itemPath = [...path, itemKey];

                        const keyCheck = validateString(itemKey, record.key, itemPath);

                        if (keyCheck !== true) issues.push(...keyCheck);

                        const valueCheck = validateField(itemValue, valueField, itemPath, cache, global, root, local);

                        if (valueCheck !== true) issues.push(...valueCheck);
                    }
                }
                else {
                    for (const [itemKey, itemValue] of entries) {
                        const itemPath = [...path, itemKey];

                        const valueCheck = validateField(itemValue, valueField, itemPath, cache, global, root, local);

                        if (valueCheck !== true) issues.push(...valueCheck);
                    }
                }
            }
            else {
                result = [{ path, issue: 'value must be an object' }];
            }
            break;
        }


        case "object": {
            const object = field as ObjectField;

            result = validateObject(value, object.of, path, cache, global, root, object, true);

            break;
        }
        case "model": {
            const model = field as ModelField;

            result = validateObject(value, model.of, path, cache, global, model, model, true);

            break;
        }
        case "group": {
            const group = field as GroupField;

            if (group.selected) {
                const selected = group.of[group.selected];

                if (selected) {
                    result = validateField(value, field, path, cache, group.of, undefined, undefined);
                }
                else {
                    result = [{ path, issue: `selection '${group.selected}' does not exist in group` }];
                }
            }
            else {
                result = validateObject(value, group.of, path, cache, undefined, undefined, undefined, false);
            }
            break;
        }

        case "union": {
            const union = field as UnionField;

            const issues: Issue[] = [];

            for (const option of union.of) {
                const optionResult = validateField(value, option, path, cache, global, root, local);

                if (optionResult === true) {
                    issues.length = 0;
                    break;
                }
                else {
                    issues.push(...optionResult);
                }
            }

            result = issues.length ? issues : true;

            break;
        }

        case "this": {
            if (local)
                result = validateField(value, local, path, cache, global, root, local);
            else
                result = [{ path, issue: 'no local field' }];
            break;
        }
        case "root": {
            if (root)
                result = validateField(value, root, path, cache, global, root, local);
            else
                result = [{ path, issue: 'no root field' }];
            break;
        }
        case "ref": {
            if (global) {
                const ref = field as RefField;

                const selected = global[ref.of];

                if (selected)
                    result = validateField(value, selected, path, cache, global, root, local);
                else
                    result = [{ path, issue: `ref: '${ref.of}' does not exist in global context` }];
            }
            else
                result = [{ path, issue: 'no root field' }];
            break;
        }
        default: {
            result = [{ path, issue: `invalid field kind: '${field.kind}'` }];
            break;
        }
    }

    fieldCache.set(value, result);

    return result;
};

const validateBounds = (value: number, field: BoundedAttributes, prefix: string): string | undefined => {
    let minMessage: string | undefined;
    let maxMessage: string | undefined;
    let minOperator = ">";
    let maxOperator = "<";

    if (field.xmin !== undefined && value <= field.xmin) {
        minMessage = `${field.xmin}`;
        minOperator = ">";
    }
    else if (field.min !== undefined && value < field.min) {
        minMessage = `${field.min}`;
        minOperator = "≥";
    }

    if (field.xmax !== undefined && value >= field.xmax) {
        maxMessage = `${field.xmax}`;
        maxOperator = "<";
    }
    else if (field.max !== undefined && value > field.max) {
        maxMessage = `${field.max}`;
        maxOperator = "≤";
    }

    if (minMessage && maxMessage) {
        return `${prefix} must be ${minOperator} ${minMessage} and ${maxOperator} ${maxMessage}.`;
    }
    else if (minMessage) {
        return `${prefix} must be ${minOperator} ${minMessage}.`;
    }
    else if (maxMessage) {
        return `${prefix} must be ${maxOperator} ${maxMessage}.`;
    }

    return undefined;
};


export const validateInteger = (value: any, field: IntegerField, path: string[]): ValidationResult => {
    if (typeof value === 'number' && Number.isInteger(value)) {
        const boundsCheck = validateBounds(length, field, 'length');

        return boundsCheck ? [{ path, issue: boundsCheck }] : true;

    }
    else {
        return [{ path, issue: 'value must be integer.' }];
    }
};

export const validateNumber = (value: any, field: NumberField, path: string[]): ValidationResult => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        const boundsCheck = validateBounds(length, field, 'length');

        return boundsCheck ? [{ path, issue: boundsCheck }] : true;
    }
    else {
        return [{ path, issue: 'value must be number.' }];
    }
};

export const validateString = (value: any, field: StringField, path: string[]): ValidationResult => {
    if (typeof value === 'string') {

        const { of: filter } = field;

        if (filter) {
            switch (filter) {

                case 'date':
                    // YYYY-MM-DD
                    // JSON Schema: date format (RFC 3339, section 5.6)
                    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
                    if (!dateRegex.test(value))
                        return [{ path, issue: 'value must be a date string' }];

                case 'time':
                    // JSON Schema: time format (RFC 3339, section 5.6)
                    const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/;
                    if (!timeRegex.test(value))
                        return [{ path, issue: 'value must be a time string' }];

                case 'datetime':
                    // JSON Schema: date-time format (RFC 3339, section 5.6)
                    const datetimeRegex = /^(\d{4})-(\d{2})-(\d{2})T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/;
                    if (!datetimeRegex.test(value))
                        return [{ path, issue: 'value must be a datetime string' }];

                case 'uuid':
                    // uuid format
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(value)) {
                        return [{ path, issue: 'value must be a uuid string' }];
                    }
                    break;

                case 'email':
                    // JSON Schema: email format (simplified RFC 5322)
                    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
                    if (!emailRegex.test(value))
                        return [{ path, issue: 'value must be an email string' }];

                case 'base64':
                    // JSON Schema: base64 format (RFC 4648, section 4)
                    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
                    if (!base64Regex.test(value))
                        return [{ path, issue: 'value must be a base64 string' }];

                default: {

                    if (filter instanceof RegExp) {
                        if (!filter.test(value))
                            return [{ path, issue: `value must match custom regex: ${filter}` }];
                    }
                    else if (typeof filter === 'string') {
                        const [matched, pattern, flags] = filter.match(/\/(.+)\/(.*)/) ?? [];

                        if (matched)
                            try {
                                const regex = new RegExp(pattern, flags);

                                if (!regex.test(value))
                                    return [{ path, issue: `value must match custom regex: ${filter}` }];
                            }
                            catch (error) {
                                return [{ path, issue: `invalid regex ${filter}` }];
                            }
                    }
                    else {
                        return [{ path, issue: `invalid string filter ${filter}` }];
                    }
                }
            }
        }

        const boundsCheck = validateBounds(value.length, field, 'value length');

        return boundsCheck ? [{ path, issue: boundsCheck }] : true;
    }
    else {
        return [{ path, issue: 'value must be string.' }];
    }
};
export const validateObject = (
    value: any,
    fields: FieldObject,
    path: string[],
    cache: Map<Field, Map<any, ValidationResult>>,
    global?: FieldObject,
    root?: ModelField | ObjectField,
    local?: ModelField | ObjectField,
    optionals: boolean = false
): ValidationResult => {
    if (Object.getPrototypeOf(value ?? true) === Object.prototype) {
        const names = new Set<string>(Object.keys(value));

        const issues: Issue[] = [];

        for (const [fieldKey, field] of Object.entries(fields)) {
            const fieldPath = [...path, fieldKey];

            if (names.has(fieldKey)) {

                names.delete(fieldKey);

                const itemValue = value[fieldKey];

                const result = validateField(itemValue, field, fieldPath, cache, global, root, local);

                if (result !== true) issues.push(...result);
            }
            else if (!optionals || !field.isOptional) {
                issues.push({ path: fieldPath, issue: `missing key '${fieldKey}'` });
            }
        }

        if (names.size) issues.push({ path, issue: `has excess keys: [${[...names].join(', ')}]` });

        return issues.length ? issues : true;
    }
    else {
        return [{ path, issue: 'value must be an object' }];
    }
}

