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
    indent?: string;
    newline?: string;
    spacing?: boolean;
    normalized?: boolean;
};

const prettifyFormat = (format: StringifyFormat): StringifyFormat => ({
    indent: '  ',
    newline: '\n',
    spacing: true,
    normalized: false,
    ...format
});

// Main stringify function
export const stringify = (
    schema: Schema,
    format: StringifyFormat = {},
    prettify: boolean = false
): string => stringifySchema(schema, prettify ? prettifyFormat(format) : format);

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
const spacer = (format: StringifyFormat) => format.spacing ? ' ' : '';

const joiner = (format: StringifyFormat) => `,${spacer(format)}`;

const stringifyString = (value: string, format: StringifyFormat) =>
    format.normalized ? JSON.stringify(value) : `'${JSON.stringify(value).slice(1, -1)}'`;

type Arg = { key?: string, symbol?: string, value: string; };

const stringifyArgs = (args: Arg[], format: StringifyFormat, separator: string = ':'): string => {
    const space = spacer(format);

    return args.map(({ key, symbol, value }) =>
        key ? `${key}${separator}${space}${value}` :
            symbol ? `${symbol}${space}${value}` : value
    ).join(joiner(format));
};

const argifyBounds = ({ min, xmin, xmax, max, exact }: SizedAttributes, format: StringifyFormat): Arg[] => {
    const normalized = format.normalized;
    const key = normalized ? 'key' : 'symbol';

    if (exact !== undefined)
        return [{ [key]: normalized ? 'exactly' : '=', value: exact.toString() }];

    const result: Arg[] = [];

    if (xmin !== undefined)
        result.push({ [key]: normalized ? 'exclusiveMin' : '>', value: xmin.toString() });
    else if (min !== undefined)
        result.push({ [key]: normalized ? 'min' : '>=', value: min.toString() });
    if (xmax !== undefined)
        result.push({ [key]: normalized ? 'exclusiveMax' : '<', value: xmax.toString() });
    else if (max !== undefined)
        result.push({ [key]: normalized ? 'max' : '<=', value: max.toString() });

    return result;
};

// Schema-specific stringification functions
const stringifySimpleSchema = (name: string, format: StringifyFormat): string => format.normalized ? `${name}()` : name;

const stringifyNullSchema = (schema: NullSchema, format: StringifyFormat): string => stringifySimpleSchema('null', format);

const stringifyAnySchema = (schema: AnySchema, format: StringifyFormat): string => stringifySimpleSchema('any', format);

const stringifyBooleanSchema = (schema: BooleanSchema, format: StringifyFormat): string => stringifySimpleSchema('boolean', format);

const stringifyThisSchema = (schema: ThisSchema, format: StringifyFormat): string => stringifySimpleSchema('this', format);

const stringifyRootSchema = (schema: RootSchema, format: StringifyFormat): string => stringifySimpleSchema('root', format);


const stringifyRefSchema = (schema: RefSchema, format: StringifyFormat): string =>
    format.normalized
        ? `ref(${stringifyArgs([{ key: 'of', value: schema.of }], format)})`
        : `${schema.of}`;


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
    const args = argifyBounds(schema, format);

    return (format.normalized || args.length)
        ? `${schemaType}(${stringifyArgs(args, format, '')})`
        : schemaType;
};

const stringifyIntegerSchema = (schema: IntegerSchema, format: StringifyFormat): string => stringifyNumbericSchema('integer', schema, format);

const stringifyNumberSchema = (schema: NumberSchema, format: StringifyFormat): string => stringifyNumbericSchema('number', schema, format);


const stringifyStringSchema = (schema: StringSchema, format: StringifyFormat): string => {
    let regex: RegexString | undefined;

    let pattern: StringSchemaFormat | undefined;

    if (schema.of) {
        if (schema.of instanceof RegExp)
            regex = schema.of.toString() as RegexString;
        else if (isStringFormat(schema.of))
            pattern = schema.of;
        else
            regex = schema.of;
    }

    const args = argifyBounds(schema, format);

    if (format.normalized || (regex && args.length)) {
        if (schema.of)
            args.unshift({ key: 'of', value: stringifyString(regex ?? pattern!, format) });

        return `string(${stringifyArgs(args, format)})`;
    }
    else {
        const kind = regex ?? pattern ?? 'string';

        return args.length ? `${kind}(${stringifyArgs(args, format)})` : kind;
    }
};

const stringifyArraySchema = (schema: ArraySchema, format: StringifyFormat, level: number): string => {
    const args = argifyBounds(schema, format);

    const of = stringifySchema(schema.of, format, true, level);

    if (format.normalized) {
        args.unshift({ key: 'of', value: of });

        return `array(${stringifyArgs(args, format)})`;
    }
    else {
        return `${of}[${stringifyArgs(args, format)}]`;
    }
};

const stringifyRecordSchema = (schema: RecordSchema, format: StringifyFormat, level: number): string => {
    const args = argifyBounds(schema, format);

    if (format.normalized) {
        if (schema.key)
            args.unshift({ key: 'key', value: `"${schema.key.toString()}"` });

        const of = stringifySchema(schema.of, format, true, level);

        args.unshift({ key: 'of', value: of });

        return `record(${stringifyArgs(args, format)})`;
    }
    else {
        const of = stringifySchema(schema.of, format, false, level);

        const params = schema.key ? [schema.key.toString(), of] : [of];

        const head = `record<${params.join(joiner(format))}>`;

        return args.length ? `${head}(${stringifyArgs(args, format)})` : head;
    }
};

const stringifyTupleSchema = (schema: TupleSchema, format: StringifyFormat, level: number): string => {
    const ofs = schema.of.map(item => stringifySchema(item, format, false)).join(joiner(format));

    const rest = schema.rest ? stringifyArraySchema(schema.rest, format, level) : undefined;

    if (!format.normalized) {
        const args: Arg[] = [{ value: ofs }];

        if (rest)
            args.push({ value: `...${rest}` });

        return `[${stringifyArgs(args, format)}]`;
    }
    else {
        const args: Arg[] = [{ key: 'of', value: `[${ofs}]` }];

        if (rest)
            args.push({ key: 'rest', value: rest });

        return `tuple(${stringifyArgs(args, format)})`;
    }
};

const stringifyUnionSchema = (schema: UnionSchema, format: StringifyFormat, level: number, enclosed: boolean): string => {
    const items = schema.of.map(item => stringify(item, format));

    if (!format.normalized) {
        const itemString = items.join(format.spacing ? ' | ' : '|');

        return enclosed ? `(${itemString})` : itemString;
    }
    else {
        return `union(${stringifyArgs([{ key: 'of', value: `[${items.join(joiner(format))}]` }], format)})`;
    }
};

const stringifyStructSchema = (object: SchemaObject, format: StringifyFormat, title: string, level: number, optionals: boolean): string => {
    const { indent = '', newline = '' } = format;
    const open = format.normalized ? '(' : '{';
    const close = format.normalized ? ')' : '}';
    const space = spacer(format);
    const optional = optionals ? '?:' : ':';

    const lines: string[] = [title + open];

    for (const [key, value] of Object.entries(object)) {
        const stringified = stringifySchema(value, format, false, level + 1);

        const fixedKey = key.match(/[ \r\n]/) ? `'${JSON.stringify(key).slice(1, -1)}'` : key;

        lines.push(`${indent.repeat(level + 1)}${fixedKey}${value.isOptional ? optional : ':'}${space}${stringified},`);
    }

    lines.push(`${indent.repeat(level)}${close}`);

    return lines.join(newline);
};

const stringifyObjectSchema = (schema: ObjectSchema, format: StringifyFormat, level: number): string => {
    const title = format.normalized ? 'object' : '';

    return stringifyStructSchema(schema.of, format, title, level, true);
};

const stringifyModelSchema = (schema: ModelSchema, format: StringifyFormat, level: number): string => {
    const title = 'model' + spacer(format);

    return stringifyStructSchema(schema.of, format, title, level, true);
};

const stringifyGroupSchema = (schema: GroupSchema, format: StringifyFormat, level: number): string => {
    const title = (schema.selected ? `select ${schema.selected} of ` : '') + 'group' + spacer(format);

    return stringifyStructSchema(schema.of, format, title, level, false);
};
