import { BoundedAttributes, Field, FieldObject, ModelField, ObjectField, StringField } from "../Field";
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
    return validateField(value, field, []);
};

const validateField = <const F extends Field>(
    value: any,
    field: Field,
    path: string[],
    namespace?: FieldObject,
    root?: ModelField | ObjectField,
    scope?: ModelField | ObjectField
): Result<InferField<F>> => {
    switch (field.kind) {
        case "string": {
            return validateString(value, field as StringField, path) as Result<InferField<F>>;
        }
        case "number": {
            break;
        }
        case "boolean": {
            break;
        }
        case "object": {
            break;
        }
        case "null": {
            break;
        }
        case "any": {
            break;
        }
        case "this": {
            break;
        }
        case "root": {
            break;
        }
        case "integer": {
            break;
        }
        case "literal": {
            break;
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
        case "composite": {
            break;
        }
        case "union": {
            break;
        }
        case "ref": {
            break;
        }
            "namespace";
    }

    return Result.failure();
};

const validateBounds = (value: number, field: BoundedAttributes, prefix: string): string | undefined => {
    if (field.xmin !== undefined && value < field.xmin)
        return `${prefix} must be greater than ${field.xmin}.`;
    else if (field.min !== undefined && value <= field.min)
        return `${prefix} must be at least ${field.min}.`;

    if (field.xmax !== undefined && value > field.xmax)
        return `${prefix} must be less than ${field.xmax}.`;
    else if (field.max !== undefined && value >= field.max)
        return `${prefix} must be at most ${field.max}.`;

};

const validateString = (value: any, field: StringField, path: string[]): Result<string> => {
    if (typeof value === 'string') {
        if (field.of) {
            switch (field.of) {

                case 'date':
                    // YYYY-MM-DD
                    // JSON Schema: date format (RFC 3339, section 5.6)
                    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
                    if (!dateRegex.test(value))
                        return Result.failure({ path, issue: 'Invalid date format. Use YYYY-MM-DD.' });

                case 'time':
                    // JSON Schema: time format (RFC 3339, section 5.6)
                    const timeRegex = /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/;
                    if (!timeRegex.test(value))
                        return Result.failure({ path, issue: 'Invalid time format. Use hh:mm:ss[.sss]±hh:mm.' });

                case 'datetime':
                    // JSON Schema: date-time format (RFC 3339, section 5.6)
                    const datetimeRegex = /^(\d{4})-(\d{2})-(\d{2})T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/;
                    if (!datetimeRegex.test(value))
                        return Result.failure({ path, issue: 'Invalid datetime format. Use YYYY-MM-DDThh:mm:ss[.sss]±hh:mm.' });

                case 'uuid':
                    // JSON Schema: uuid format
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(value)) {
                        return Result.failure({ path, issue: 'Invalid UUID format.' });
                    }
                    break;

                case 'email':
                    // JSON Schema: email format (simplified RFC 5322)
                    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
                    if (!emailRegex.test(value))
                        return Result.failure({ path, issue: 'Invalid email format.' });

                case 'base64':
                    // JSON Schema: base64 format (RFC 4648, section 4)
                    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
                    if (!base64Regex.test(value))
                        return Result.failure({ path, issue: 'Invalid base64 format.' });

            }
        }
        const bounds = validateBounds(value.length, field, 'String length');

        if (bounds)
            return Result.failure({ path, issue: bounds });
    }

    return Result.failure({ path, issue: 'value must be string.' });
};
