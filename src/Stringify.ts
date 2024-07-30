import { isStringPattern } from "./isStringPattern";
import {
    AnySchema, ArraySchema, BooleanSchema, BoundedAttributes, GroupSchema,
    IntegerSchema, LiteralSchema, ModelSchema, NullSchema,
    NumberSchema, ObjectSchema, RecordSchema, RefSchema,
    RootSchema, Schema, StringSchema, ThisSchema,
    TupleSchema, UnionSchema
} from "./Schema";


export type StringifyFormat = {
    indent?: string;
    newline?: string;
    alwaysParenthesis?: boolean;
    alwaysExplicit?: boolean;
    spaceAfterSemicolon?: boolean;
};

export const PrettyStringifyFormat = (format: StringifyFormat = {}): StringifyFormat => ({
    indent: '  ',
    newline: '\n',
    alwaysParenthesis: false,
    alwaysExplicit: false,
    spaceAfterSemicolon: true,
    ...format
});

export const stringifySchema = (schema: Schema, format: StringifyFormat = {}) => {
    switch (schema.kind) {
        case 'null': return stringifyNullSchema(schema as NullSchema, format);
        case 'any': return stringifyAnySchema(schema as AnySchema, format);
        case 'boolean': return stringifyBooleanSchema(schema as BooleanSchema, format);
        case 'integer': return stringifyIntegerSchema(schema as IntegerSchema, format);
        case 'number': return stringifyNumberSchema(schema as NumberSchema, format);
        case 'literal': return stringifyLiteralSchema(schema as LiteralSchema, format);
        case 'string': return stringifyStringSchema(schema as StringSchema, format);
    }
    // NullSchema;
    // AnySchema;
    // BooleanSchema;
    // IntegerSchema;
    // NumberSchema;
    // StringSchema;
    // LiteralSchema;
    // ArraySchema;
    // TupleSchema;
    // RecordSchema;
    // UnionSchema;
    // ObjectSchema;
    // ModelSchema;
    // GroupSchema;
    // RefSchema;
    // RootSchema;
    // ThisSchema;
};

const stringifyNullSchema = (schema: NullSchema, format: StringifyFormat) => {
    return format.alwaysParenthesis ? 'null()' : 'null';
};

const stringifyAnySchema = (schema: AnySchema, format: StringifyFormat) => {
    return format.alwaysParenthesis ? 'any()' : 'any';
};

const stringifyBooleanSchema = (schema: BooleanSchema, format: StringifyFormat) => {
    return format.alwaysParenthesis ? 'boolean()' : 'boolean';
};

const stringifyLiteralSchema = (schema: LiteralSchema, format: StringifyFormat) => {
    return JSON.stringify(schema.of);
};

// type bounds = { min?: number; xmin?: number; xmax?: number; max?: number; }
const stringifyBounds = ({ min, xmin, xmax, max }: BoundedAttributes, format: StringifyFormat, collapsible: boolean): string => {
    // collapsible turns min = max to a single number
    if (collapsible && min === max && min !== undefined && xmax === undefined && xmin === undefined)
        return min.toString();

    let result: string[] = [];

    if (xmin !== undefined)
        result.push(`xmin: ${xmin.toString()}`);
    else if (min !== undefined)
        result.push(`min: ${min.toString()}`);

    if (xmax !== undefined)
        result.push(`xmax: ${xmax.toString()}`);
    else if (max !== undefined)
        result.push(`max: ${max.toString()}`);

    return result.join(format.spaceAfterSemicolon ? '; ' : ';');
};

const stringifyIntegerSchema = (schema: IntegerSchema, format: StringifyFormat) => {
    const bounds = stringifyBounds(schema, format, false);

    return bounds || format.alwaysParenthesis ? `integer(${bounds})` : 'integer';
};

const stringifyNumberSchema = (schema: NumberSchema, format: StringifyFormat) => {
    const bounds = stringifyBounds(schema, format, false);

    return bounds || format.alwaysParenthesis ? `number(${bounds})` : 'number';
};

const stringifyStringSchema = (schema: StringSchema, format: StringifyFormat) => {
    const bounds = stringifyBounds(schema, format, !format.alwaysExplicit && schema.of === undefined);

    let kind = 'string';

    if (typeof schema.of === 'string' && isStringPattern(schema.of))
        kind = schema.of;

    return bounds || format.alwaysParenthesis ? `${kind}(${bounds})` : `${kind}`;
};