import {
    ArraySchema, GroupSchema, IntegerSchema, LiteralSchema,
    ModelSchema, NumberSchema, ObjectSchema, RecordSchema,
    RefSchema, Schema, SchemaObject, SizedAttributes,
    StringSchema, TupleSchema, UnionSchema
} from "./Schema";

// Types and constants
export type StringifyFormat = {
    indent: string;
    newline: string;
    spacing: string;
    comments: boolean;
};

const condensedFormat = (format: Partial<StringifyFormat>): StringifyFormat => ({
    indent: '',
    spacing: '',
    newline: '',
    comments: false,
    ...format
});

const prettifyFormat = (format: Partial<StringifyFormat>): StringifyFormat => ({
    indent: '  ',
    spacing: ' ',
    newline: '\n',
    comments: false,
    ...format
});

// Main stringify function
export const stringify = (
    schema: Schema,
    format: Partial<StringifyFormat> = {},
    condensed: boolean = false
): string => {
    const stringifyFormat = condensed ? condensedFormat(format) : prettifyFormat(format);

    const description = (format.comments && schema.description) ? stringifyDescription(schema.description, stringifyFormat) : '';

    return description + stringifyFormat.newline + stringifySchema(schema, stringifyFormat);
};

// Main schema stringification function
const stringifySchema = (schema: Schema, format: StringifyFormat, level: number = 0, enclosed: boolean = false): string => {
    switch (schema.kind) {
        case 'null': return 'null';
        case 'any': return 'any';
        case 'boolean': return 'boolean';
        case 'this': return 'this';
        case 'root': return 'root';
        case 'ref': return stringifyRefSchema(schema as RefSchema, format);
        case 'integer': return stringifyNumericSchema(schema as IntegerSchema, format);
        case 'number': return stringifyNumericSchema(schema as NumberSchema, format);
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

const stringifyString = (value: string) => `'${JSON.stringify(value).slice(1, -1)}'`;

const stringifyDescription = (value: string, format: StringifyFormat): string => {
    return `/*${format.spacing}${value}${format.spacing}*/`;
};

// exact: =; min: > | >=, max; < | <=
// (exact NUMBER) | (min NUMBER) | (max NUMBER) | (min NUMBER, max NUMBER)
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
const stringifyRefSchema = (schema: RefSchema, format: StringifyFormat): string => schema.of;

const stringifyLiteralSchema = (schema: LiteralSchema, format: StringifyFormat): string => {
    switch (typeof schema.of) {
        case 'number':
        case 'boolean':
            return schema.of.toString();
        case 'string':
            return stringifyString(schema.of);
    }
};

const stringifyNumericSchema = (schema: IntegerSchema | NumberSchema, format: StringifyFormat): string => {
    const bounds = stringifyBounds(schema, format);

    return (bounds.length) ? `${schema.kind}(${bounds})` : schema.kind;
};

const stringifyStringSchema = (schema: StringSchema, format: StringifyFormat): string => {
    const kind = schema.of?.toString() ?? 'string';

    const bounds = stringifyBounds(schema, format);

    return bounds.length ? `${kind}(${bounds})` : kind;

};

// SCHEMA[SIZE...]
const stringifyArraySchema = (schema: ArraySchema, format: StringifyFormat, level: number): string => {
    const of = stringifySchema(schema.of, format, level, true);

    const bounds = stringifyBounds(schema, format);

    return `${of}[${bounds}]`;
};

// record<V>(SIZE...) | record<K|V>(SIZE...)
const stringifyRecordSchema = (schema: RecordSchema, format: StringifyFormat, level: number): string => {
    const key = schema.key ? stringifyStringSchema(schema.key, format) : '';

    const of = stringifySchema(schema.of, format, level, false);

    const bounds = stringifyBounds(schema, format);

    const params = key ? [key, of] : [of];

    const head = `record<${params.join(joiner(format))}>`;

    return bounds.length ? `${head}(${bounds})` : head;
};

// [SCHEMAS..., ...REST]
const stringifyTupleSchema = (schema: TupleSchema, format: StringifyFormat, level: number): string => {
    const schemas = schema.of.map(item => stringifySchema(item, format, level + 1, false));

    const rest = schema.rest ? stringifyArraySchema(schema.rest, format, level) : undefined;

    if (rest)
        schemas.push(`...${rest}`);

    return `[${schemas.join(joiner(format))}]`;
};

const stringifyUnionSchema = (schema: UnionSchema, format: StringifyFormat, level: number, enclosed: boolean): string => {
    const items = schema.of.map(item => stringifySchema(item, format, level, enclosed));

    const itemString = items.join(`${format.spacing}|${format.spacing}`);

    return enclosed ? `(${itemString})` : itemString;
};

const stringifyStructSchema = (object: SchemaObject, format: StringifyFormat, title: string, level: number, optionals: boolean): string => {
    const open = '{';
    const close = '}';
    const required = ':';
    const optional = optionals ? '?:' : ':';

    const lines: string[] = [title + open];

    for (const [key, value] of Object.entries(object)) {
        const schema = stringifySchema(value, format, level + 1, false);

        const fixedKey = key.match(/[ \r\n]/) ? stringifyString(key) : key;

        const description = (format.comments && value.description)
            ? `${format.indent.repeat(level + 1)}${stringifyDescription(value.description, format)}`
            : '';

        const property = `${format.indent.repeat(level + 1)}${fixedKey}${value.isOptional ? optional : required}${format.spacing}${schema},`;

        lines.push(description ? [description, property].join(format.newline) : property);
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
    const selected = (schema.selected ? `select ${schema.selected} of ` : '');

    const title = selected + 'group' + format.spacing;

    return stringifyStructSchema(schema.of, format, title, level, false);
};
// SOME NOTES
// 1. the defined subtypes of a string are a subset of json schema's format. they are not implementation dependent, and they use the subtype as the type name
// - ex: { kind: 'string', of: /ABC/ } => /ABC/, { kind: 'string', of: 'date' } => date
// 2. the custom key of a record can only be a string type - not a literal union (just use an object/model if you need literal keys)
// 3. LOCAL scope is set by ObjectSchema or ModelSchema
// 4. ROOT scope is set by a root level ObjectSchema or ModelSchema at any level
// 5. GLOBAL namespace is set by a GroupSchema, each of the properties is a referable identifier
// 6. ThisSchema refers to the LOCAL scope (if exists) for recursion
// 7. RootSchema refers to the ROOT scope (if exists) for recursion
// 8. RefSchema refers to an identifier in the GLOBAL namespace (if exists)