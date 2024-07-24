import { BoundedAttributes, Field, FieldObject, LiteralField, ModelField, ObjectField, StringField } from "../Field";
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
    failure: (...issues: Issue[]): ResultFailure => ({ success: false, issues })
});


export const validate = <const F extends Field>(value: any, field: F): Result<InferField<F>> => {
    const result = validateField(value, field, []);

    return result ? result : Result.success(value);
};

const validateField = <const F extends Field>(
    value: any,
    field: Field,
    path: string[],
    namespace?: FieldObject,
    root?: ModelField | ObjectField,
    scope?: ModelField | ObjectField
): ResultFailure | undefined => {
    switch (field.kind) {
        case "any": {
            return;
        }
        case "null": {
            return value === null ? undefined : Result.failure({ path, issue: 'value must be null' });
        }
        case "boolean": {
            return typeof value === 'boolean' ? undefined : Result.failure({ path, issue: 'value must be boolean' });
        }
        case "literal": {
            const literal = (field as LiteralField).of;
            return value === literal ? undefined : Result.failure({ path, issue: `value must be ${literal}` });
        }

        case "number": {
            break;
        }
        case "integer": {
            break;
        }

        case "string": {
            return validateString(value, field as StringField, path);
        }
        case "array": {
            break;
        }
        case "tuple": {
            break;
        }

        case "record": {
            break;
        }
        case "model": {
            break;
        }
        case "object": {
            break;
        }
        case "composite": {
            break;
        }

        case "union": {
            break;
        }

        case "namespace": {
            break;
        }
        case "this": {
            break;
        }
        case "root": {
            break;
        }
        case "ref": {
            break;
        }
    }

    return Result.failure();
};

const validateBounds = (value: number, field: BoundedAttributes, prefix: string): string | undefined => {
    if (field.xmin !== undefined && value <= field.xmin)
        return `${prefix} must be greater than ${field.xmin}.`;
    else if (field.min !== undefined && value < field.min)
        return `${prefix} must be greater than or equal to ${field.min}.`;

    if (field.xmax !== undefined && value >= field.xmax)
        return `${prefix} must be less than ${field.xmax}.`;
    else if (field.max !== undefined && value > field.max)
        return `${prefix} must be less than or equal to ${field.max}.`;

};

export const validateString = (value: any, field: StringField, path: string[]): ResultFailure | undefined => {
    if (typeof value === 'string') {

        const { of: filter } = field;

        if (filter) {
            switch (filter) {

                case 'date':
                    // YYYY-MM-DD
                    // JSON Schema: date format (RFC 3339, section 5.6)
                    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
                    if (!dateRegex.test(value))
                        return Result.failure({ path, issue: 'value must be a date string' });

                case 'time':
                    // JSON Schema: time format (RFC 3339, section 5.6)
                    const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/;
                    if (!timeRegex.test(value))
                        return Result.failure({ path, issue: 'value must be a time string' });

                case 'datetime':
                    // JSON Schema: date-time format (RFC 3339, section 5.6)
                    const datetimeRegex = /^(\d{4})-(\d{2})-(\d{2})T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/;
                    if (!datetimeRegex.test(value))
                        return Result.failure({ path, issue: 'value must be a datetime string' });

                case 'uuid':
                    // uuid format
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(value)) {
                        return Result.failure({ path, issue: 'value must be a uuid string' });
                    }
                    break;

                case 'email':
                    // JSON Schema: email format (simplified RFC 5322)
                    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
                    if (!emailRegex.test(value))
                        return Result.failure({ path, issue: 'value must be an email string' });

                case 'base64':
                    // JSON Schema: base64 format (RFC 4648, section 4)
                    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
                    if (!base64Regex.test(value))
                        return Result.failure({ path, issue: 'value must be a base64 string' });

                default: {

                    if (filter instanceof RegExp) {
                        if (!filter.test(value))
                            return Result.failure({ path, issue: `value must match custom regex: ${filter}` });
                    }
                    else if (typeof filter === 'string') {
                        const [matched, pattern, flags] = filter.match(/\/(.+)\/(.*)/) ?? [];

                        if (matched)
                            try {
                                const regex = new RegExp(pattern, flags);

                                if (!regex.test(value))
                                    return Result.failure({ path, issue: `value must match custom regex: ${filter}` });
                            }
                            catch (error) {
                                return Result.failure({ path, issue: `invalid regex ${filter}` });
                            }
                    }
                    else {
                        return Result.failure({ path, issue: `invalid string filter ${filter}` });
                    }
                }
            }
        }
        const bounds = validateBounds(value.length, field, 'value length');

        if (bounds)
            return Result.failure({ path, issue: bounds });
    };

    return Result.failure({ path, issue: 'value must be string.' });
};
