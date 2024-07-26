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

export type ValidationResult = true | Issue[];

export type ResultCache = Map<any, ValidationResult>;

export type FieldCache = Map<Field, ResultCache>;

export type Context = {
    cache: FieldCache;
    global?: FieldObject,
    root?: ModelField | ObjectField,
    local?: ModelField | ObjectField;
};

export const newResultCache = (): ResultCache => new Map<any, ValidationResult>();

export const newFieldCache = (): FieldCache => new Map<Field, ResultCache>();

export const makeContext = (
    cache: Context['cache'] = newFieldCache(),
    global?: Context['global'],
    root?: Context['root'],
    local?: Context['local']) => ({ cache, global, root, local });


export const validate = <const F extends Field>(value: any, field: F): Result<InferField<F>> => {
    const result = validateField(value, field, [], makeContext());

    return result !== true ? Result.failure(result) : Result.success(value);
};

export const validateField = (value: any, field: Field, path: string[], context: Context): ValidationResult => {

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
        /* TERMINALS */
        case "any": {
            result = validateAny(value, path );
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
            result = validateArray(value, field as ArrayField, path, context);
            break;
        }

        case "tuple": {
            result = validateTuple(value, field as TupleField, path, context);
            break;
        }

        case "record": {
            result = validateRecord(value, field as RecordField, path, context);
            break;
        }

        case "object": {
            const object = field as ObjectField;
            result = validateObject(value, object.of, path, makeContext(context.cache, context.global, context.root, object), true);
            break;
        }
        case "model": {
            const model = field as ModelField;
            result = validateObject(value, model.of, path, makeContext(context.cache, context.global, model, model), true);
            break;
        }
        case "group": {
            const group = field as GroupField;

            if (group.selected) {
                const selected = group.of[group.selected];

                if (selected) {
                    result = validateField(value, field, path, makeContext(context.cache, group.of));
                }
                else {
                    result = [{ path, issue: `selection '${group.selected}' does not exist in group` }];
                }
            }
            else {
                result = validateObject(value, group.of, path, makeContext(context.cache), false);
            }
            break;
        }

        case "union": {
            const union = field as UnionField;

            const issues: Issue[] = [];

            for (const option of union.of) {
                const optionResult = validateField(value, option, path, context);

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
            result = context.local ? validateField(value, context.local, path, context) : [{ path, issue: 'no local field' }];
            break;
        }
        case "root": {
            result = (context.root) ? validateField(value, context.root, path, context) : [{ path, issue: 'no root field' }];
            break;
        }
        case "ref": {
            if (context.global) {
                const ref = field as RefField;

                const selected = context.global[ref.of];

                if (selected)
                    result = validateField(value, selected, path, context);
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

    resultCache.set(value, result);

    return result;
};

export const isObject = (value: any): value is Object => Object.getPrototypeOf(value ?? true) === Object.prototype;


export const validateAny = (value: any, path: string[]): ValidationResult => {

    if (value === null)
        return true;
    else if (typeof value === 'boolean')
        return true;
    else if (typeof value === 'number')
        return true;
    else if (typeof value === 'string')
        return true;
    else if (Array.isArray(value)) {
        const issues: Issue[] = [];

        for (let i = 0; i < value.length; i++) {
            const result = validateAny(value[i], [...path, i.toString()]);

            if (result !== true) issues.push(...result);
        }

        return issues.length ? issues : true;
    }
    else if (isObject(value)) {
        const issues: Issue[] = [];

        for (const [itemKey, itemValue] of Object.entries(value)) {
            const result = validateAny(itemValue, [...path, itemKey]);

            if (result !== true) issues.push(...result);
        }

        return issues.length ? issues : true;
    }
    else {
        return [{ path, issue: 'not a valid type' }];
    }
};

export const validateBounds = (value: number, field: BoundedAttributes, prefix: string): string | undefined => {
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

export const validateArray = (value: any, array: ArrayField, path: string[], context: Context): ValidationResult => {
    if (Array.isArray(value)) {

        const boundsCheck = validateBounds(value.length, array, 'value length');

        if (boundsCheck) {
            return [{ path, issue: boundsCheck }];
        }
        else {
            let issues: Issue[] = [];

            for (let i = 0; i <= value.length; i++) {
                const result = validateField(value, array.of, [...path, i.toString()], context);

                if (result !== true) issues.push(...result);
            }

            return issues.length ? issues : true;
        }
    }
    else {
        return [{ path, issue: 'value must be an array' }];
    };
};

export const validateTuple = (value: any, field: TupleField, path: string[], context: Context): ValidationResult => {
    if (Array.isArray(value)) {

        const boundsCheck = validateBounds(value.length, field, 'value length');

        if (boundsCheck) {
            return [{ path, issue: boundsCheck }];
        }
        else {
            const issues: Issue[] = [];

            let i = 0;

            for (const item of field.of) {
                const result = validateField(value, item, [...path, i.toString()], context);

                if (result !== true) issues.push(...result);

                i++;
            }

            if (field.rest) {
                while (i < value.length) {
                    const result = validateField(value, field.rest, [...path, i.toString()], context);

                    if (result !== true) issues.push(...result);

                    i++;
                }
            }

            return issues.length ? issues : true;
        }
    }
    else {
        return [{ path, issue: 'value must be a tuple' }];
    }
};

export const validateRecord = (value: any, field: RecordField, path: string[], context: Context): ValidationResult => {
    if (Object.getPrototypeOf(value ?? true) === Object.prototype) {

        const issues: Issue[] = [];

        const entries = Object.entries(value);

        const boundsCheck = validateBounds(entries.length, field, 'value length');

        if (boundsCheck)
            issues.push({ path, issue: boundsCheck });

        const valueField = field.of || ({ kind: 'any' });

        if (field.key) {
            for (const [itemKey, itemValue] of entries) {
                const itemPath = [...path, itemKey];

                const keyCheck = validateString(itemKey, field.key, itemPath);

                if (keyCheck !== true) issues.push(...keyCheck);

                const valueCheck = validateField(itemValue, valueField, itemPath, context);

                if (valueCheck !== true) issues.push(...valueCheck);
            }
        }
        else {
            for (const [itemKey, itemValue] of entries) {
                const itemPath = [...path, itemKey];

                const valueCheck = validateField(itemValue, valueField, itemPath, context);

                if (valueCheck !== true) issues.push(...valueCheck);
            }
        }
        return issues.length ? issues : true;
    }
    else {
        return [{ path, issue: 'value must be an object' }];
    }

};

export const validateObject = (
    value: any,
    fields: FieldObject,
    path: string[],
    context: Context,
    optionals: boolean = false
): ValidationResult => {
    if (isObject(value)) {
        const names = new Set<string>(Object.keys(value));

        const issues: Issue[] = [];

        for (const [fieldKey, field] of Object.entries(fields)) {
            const fieldPath = [...path, fieldKey];

            if (names.has(fieldKey)) {

                names.delete(fieldKey);

                const itemValue = value[fieldKey];

                const result = validateField(itemValue, field, fieldPath, context);

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
};


