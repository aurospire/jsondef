import { isStringFormat } from "./isStringFormat";
import {
    AnySchema, ArraySchema, BooleanSchema, GroupSchema,
    IntegerSchema, LiteralSchema, ModelSchema, NullSchema,
    NumberSchema, ObjectSchema, RecordSchema, RefSchema,
    RootSchema, Schema, SchemaObject, SizedAttributes,
    StringSchema, StringSchemaFormat, ThisSchema, TupleSchema,
    UnionSchema
} from "./Schema";
import { RegexString } from "./util";

// Types and constants
export type StringifyFormat = {
    indent: string;
    newline: string;
    spacing: string;
    full: boolean;
};

const condensedFormat = (format: Partial<StringifyFormat>): StringifyFormat => ({
    indent: '',
    spacing: '',
    newline: '',
    full: false,
    ...format
});

const prettifyFormat = (format: Partial<StringifyFormat>): StringifyFormat => ({
    indent: '  ',
    spacing: ' ',
    newline: '\n',
    full: false,
    ...format
});

// Main stringify function
export const stringify = (
    schema: Schema,
    format: Partial<StringifyFormat> = {},
    condensed: boolean = false
): string => stringifySchema(schema, condensed ? condensedFormat(format) : prettifyFormat(format));

// Main schema stringification function
const stringifySchema = (schema: Schema, format: StringifyFormat, enclosed: boolean = false, level: number = 0): string => {
    switch (schema.kind) {
        case 'null': return stringifyNullSchema(schema as NullSchema, format);
        case 'any': return stringifyAnySchema(schema as AnySchema, format);
        case 'boolean': return stringifyBooleanSchema(schema as BooleanSchema, format);
        case 'this': return stringifyThisSchema(schema as ThisSchema, format);
        case 'root': return stringifyRootSchema(schema as RootSchema, format);
        case 'ref': return stringifyRefSchema(schema as RefSchema, format);
        case 'integer': return stringifyIntegerSchema(schema as IntegerSchema, format);
        case 'number': return stringifyNumberSchema(schema as NumberSchema, format);
        case 'literal': return stringifyLiteralSchema(schema as LiteralSchema, format);
        case 'string': return stringifyStringSchema(schema as StringSchema, format);
        case 'array': return stringifyArraySchema(schema as ArraySchema, format, level);
        case 'tuple': return stringifyTupleSchema(schema as TupleSchema, format, level);
        case 'record': return stringifyRecordSchema(schema as RecordSchema, format, level);
        case 'union': return stringifyUnionSchema(schema as UnionSchema, format, level, enclosed);
        case 'object': return stringifyObjectSchema(schema as ObjectSchema, format, level);
        case 'model': return stringifyModelSchema(schema as ModelSchema, format, level);
        case 'group': return stringifyGroupSchema(schema as GroupSchema, format, level);
    }
};

// Helper functions
const joiner = (format: StringifyFormat) => ',' + format.spacing;

const stringifyString = (value: string, format: StringifyFormat) => `'${JSON.stringify(value).slice(1, -1)}'`;

const stringifyBounds = ({ min, xmin, xmax, max, exact }: SizedAttributes, format: StringifyFormat): string => {

    if (exact !== undefined)
        return `=${format.spacing}${exact}`;

    const results: string[] = [];

    if (xmin !== undefined)
        results.push(`>${format.spacing}${xmin}`);
    else if (min !== undefined)
        results.push(`>=${format.spacing}${min}`);

    if (xmax !== undefined)
        results.push(`<${format.spacing}${xmax}`);
    else if (max !== undefined)
        results.push(`<=${format.spacing}${max}`);

    return results.join(joiner(format));
};

// Schema-specific stringification functions
const stringifySimpleSchema = (name: string, format: StringifyFormat): string => format.full ? `${name}()` : name;

const stringifyNullSchema = (schema: NullSchema, format: StringifyFormat): string => stringifySimpleSchema('null', format);

const stringifyAnySchema = (schema: AnySchema, format: StringifyFormat): string => stringifySimpleSchema('any', format);

const stringifyBooleanSchema = (schema: BooleanSchema, format: StringifyFormat): string => stringifySimpleSchema('boolean', format);

const stringifyThisSchema = (schema: ThisSchema, format: StringifyFormat): string => stringifySimpleSchema('this', format);

const stringifyRootSchema = (schema: RootSchema, format: StringifyFormat): string => stringifySimpleSchema('root', format);


const stringifyRefSchema = (schema: RefSchema, format: StringifyFormat): string => `${schema.of}`;


const stringifyLiteralSchema = (schema: LiteralSchema, format: StringifyFormat): string => {
    switch (typeof schema.of) {
        case 'number':
        case 'boolean':
            return schema.of.toString();
        case 'string':
            return stringifyString(schema.of, format);
    }
};

const stringifyNumbericSchema = (schemaType: string, schema: IntegerSchema | NumberSchema, format: StringifyFormat): string => {
    const bounds = stringifyBounds(schema, format);

    return (format.full || bounds.length) ? `${schemaType}(${bounds})` : schemaType;
};

const stringifyIntegerSchema = (schema: IntegerSchema, format: StringifyFormat): string => stringifyNumbericSchema('integer', schema, format);

const stringifyNumberSchema = (schema: NumberSchema, format: StringifyFormat): string => stringifyNumbericSchema('number', schema, format);


const stringifyStringSchema = (schema: StringSchema, format: StringifyFormat): string => {
    const bounds = stringifyBounds(schema, format);

    const kind = schema.of?.toString() ?? 'string';

    return format.full || bounds.length ? `${kind}(${bounds})` : kind;

};

// SCHEMA[SIZE...]
const stringifyArraySchema = (schema: ArraySchema, format: StringifyFormat, level: number): string => {
    const bounds = stringifyBounds(schema, format);

    const of = stringifySchema(schema.of, format, true, level);

    return `${of}[${bounds}]`;
};

// record<V>(SIZE...) | record<K|V>(SIZE...)
const stringifyRecordSchema = (schema: RecordSchema, format: StringifyFormat, level: number): string => {
    const bounds = stringifyBounds(schema, format);

    const key = schema.key ? stringifyStringSchema(schema.key, format) : '';

    const of = stringifySchema(schema.of, format, false, level);

    const params = key ? [key, of] : [of];

    const head = `record<${params.join(joiner(format))}>`;

    return format.full || bounds.length ? `${head}(${bounds})` : head;
};

// [SCHEMAS..., ...REST]
const stringifyTupleSchema = (schema: TupleSchema, format: StringifyFormat, level: number): string => {
    const schemas = schema.of.map(item => stringifySchema(item, format, false));

    const rest = schema.rest ? stringifyArraySchema(schema.rest, format, level) : undefined;

    if (rest)
        schemas.push(`...${rest}`);

    return `[${schemas.join(joiner(format))}]`;
};

const stringifyUnionSchema = (schema: UnionSchema, format: StringifyFormat, level: number, enclosed: boolean): string => {
    const items = schema.of.map(item => stringify(item, format));

    const itemString = items.join(format.spacing ? ' | ' : '|');

    return enclosed ? `(${itemString})` : itemString;
};

const stringifyStructSchema = (object: SchemaObject, format: StringifyFormat, title: string, level: number, optionals: boolean): string => {
    const open = '{';
    const close = '}';
    const optional = optionals ? '?:' : ':';

    const lines: string[] = [title + open];

    for (const [key, value] of Object.entries(object)) {
        const schema = stringifySchema(value, format, false, level + 1);

        const fixedKey = key.match(/[ \r\n]/) ? stringifyString(key, format) : key;

        lines.push(`${format.indent.repeat(level + 1)}${fixedKey}${value.isOptional ? optional : ':'}${format.spacing}${schema},`);
    }

    if (lines.length > 1)
        lines.push(`${format.indent.repeat(level)}${close}`);
    else
        lines[0] += close;

    return lines.join(format.newline);
};

const stringifyObjectSchema = (schema: ObjectSchema, format: StringifyFormat, level: number): string => {
    return stringifyStructSchema(schema.of, format, '', level, true);
};

const stringifyModelSchema = (schema: ModelSchema, format: StringifyFormat, level: number): string => {
    const title = 'model' + format.spacing;

    return stringifyStructSchema(schema.of, format, title, level, true);
};

const stringifyGroupSchema = (schema: GroupSchema, format: StringifyFormat, level: number): string => {
    const title = (schema.selected ? `select ${schema.selected} of ` : '') + 'group' + format.spacing;

    return stringifyStructSchema(schema.of, format, title, level, false);
};
