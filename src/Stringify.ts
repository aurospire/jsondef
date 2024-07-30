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
    spaceAfterSemicolon?: boolean;
};

export const stringifySchema = (schema: Schema, format: StringifyFormat) => {
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
    const bounds = stringifyBounds(schema, format, schema.of === undefined);

    return bounds || format.alwaysParenthesis ? `string(${bounds})` : 'string';
};

