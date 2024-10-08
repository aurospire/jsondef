import { Schema, RefSchema, IntegerSchema, NumberSchema, LiteralSchema, StringSchema, ArraySchema, TupleSchema, RecordSchema, UnionSchema, ObjectSchema, ModelSchema, GroupSchema, SizedAttributes, SchemaObject } from "../Schema";
import { StringifyFormat } from "./StringifyFormat";

// Main schema stringification function
export const stringifySchema = (schema: Schema, format: StringifyFormat, level: number = 0, enclosed: boolean = false): string => {
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
const stringifyString = (value: string) => `'${JSON.stringify(value).slice(1, -1)}'`;

// exact: =; min: > | >=, max; < | <=
// (exact NUMBER) | (min NUMBER) | (max NUMBER) | (min NUMBER && max NUMBER)
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

    // return results.join(`${format.spacing}&&${format.spacing}`);
    return results.join(`,${format.spacing}`);
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

    const head = `record<${params.join(`,${format.spacing}`)}>`;

    return bounds.length ? `${head}(${bounds})` : head;
};

// [SCHEMAS..., ...REST]
const stringifyTupleSchema = (schema: TupleSchema, format: StringifyFormat, level: number): string => {
    const schemas = schema.of.map(item => stringifySchema(item, format, level + 1, false));

    const rest = schema.rest ? stringifyArraySchema(schema.rest, format, level) : undefined;

    if (rest)
        schemas.push(`...${rest}`);

    return `[${schemas.join(`,${format.spacing}`)}]`;
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

    const header = title + open;

    const props = Object.entries(object).map(([key, value]) => {
        const schema = stringifySchema(value, format, level + 1, false);

        const fixedKey = key.match(/[ \r\n]/) ? stringifyString(key) : key;

        const property = `${format.indent.repeat(level + 1)}${fixedKey}${value.isOptional ? optional : required}${format.spacing}${schema}`;

        return property;
    });

    if (props.length === 0)
        return header + close;

    return [
        header,
        props.join(',' + format.newline),
        format.indent.repeat(level) + close
    ].join(format.newline);
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
