import { isStringFormat } from "./isStringFormat";
import {
    AnySchema, ArraySchema, BooleanSchema, BoundedAttributes, GroupSchema,
    IntegerSchema, LiteralSchema, ModelSchema, NullSchema,
    NumberSchema, ObjectSchema, RecordSchema, RefSchema,
    RootSchema, Schema, SchemaObject, StringSchema, StringSchemaFormat, ThisSchema,
    TupleSchema, UnionSchema
} from "./Schema";
import { RegexString } from "./util";


export type StringifyFormat = {
    indent?: string;
    newline?: string;
    spacing?: boolean;
    normalized?: boolean;
};

export const PrettyStringifyFormat = (format: StringifyFormat = {}): StringifyFormat => ({
    indent: '  ',
    newline: '\n',
    spacing: true,
    normalized: false,
    ...format
});

const joiner = (format: StringifyFormat) => `,${format.spacing ? ' ' : ''}`;

type Arg = { key?: string, value: string; };

const stringifyArgs = (args: Arg[], format: StringifyFormat): string => {
    const space = format.spacing ? ' ' : '';

    return args.map(({ key, value }) => {
        return key ? `${key}:${space}${value}` : value;
    }).join(joiner(format));
};

// type bounds = { min?: number; xmin?: number; xmax?: number; max?: number; }
const argifyBounds = ({ min, xmin, xmax, max }: BoundedAttributes, lengthArg: 'none' | 'implicit' | 'explicit'): Arg[] => {
    if (lengthArg !== 'none' && min === max && min !== undefined && xmax === undefined && xmin === undefined)
        return lengthArg === 'explicit' ? [{ key: 'length', value: min.toString() }] : [{ value: min.toString() }];

    let result: Arg[] = [];

    if (xmin !== undefined)
        result.push({ key: 'xmin', value: xmin.toString() });
    else if (min !== undefined)
        result.push({ key: 'min', value: min.toString() });

    if (xmax !== undefined)
        result.push({ key: 'xmax', value: xmax.toString() });

    else if (max !== undefined)
        result.push({ key: 'max', value: max.toString() });


    return result;
};

export const stringify = (schema: Schema, format: StringifyFormat = {}): string => stringifySchema(schema, format);

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

        case 'array': return stringifyArraySchema(schema as ArraySchema, format);
        case 'tuple': return stringifyTupleSchema(schema as TupleSchema, format);
        case 'record': return stringifyRecordSchema(schema as RecordSchema, format);

        case 'union': return stringifyUnionSchema(schema as UnionSchema, format, enclosed);

        case 'object': return stringifyObjectSchema(schema as ObjectSchema, format, level);
        // ModelSchema;
        // GroupSchema;
    }
    return '';
};

const stringifyNullSchema = (schema: NullSchema, format: StringifyFormat): string => {
    return format.normalized ? 'null()' : 'null';
};

const stringifyAnySchema = (schema: AnySchema, format: StringifyFormat): string => {
    return format.normalized ? 'any()' : 'any';
};

const stringifyBooleanSchema = (schema: BooleanSchema, format: StringifyFormat): string => {
    return format.normalized ? 'boolean()' : 'boolean';
};

const stringifyThisSchema = (schema: ThisSchema, format: StringifyFormat): string => {
    return format.normalized ? 'this()' : 'this';
};

const stringifyRootSchema = (schema: RootSchema, format: StringifyFormat): string => {
    return format.normalized ? 'root()' : 'root';
};

const stringifyRefSchema = (schema: RefSchema, format: StringifyFormat): string => {
    return format.normalized ? `ref(${stringifyArgs([{ key: 'of', value: schema.of }], format)})` : `${schema.of}`;
};

const stringifyLiteralSchema = (schema: LiteralSchema, format: StringifyFormat): string => {
    return JSON.stringify(schema.of);
};

const stringifyIntegerSchema = (schema: IntegerSchema, format: StringifyFormat): string => {
    const args = argifyBounds(schema, 'none');

    return (format.normalized || args.length) ? `integer(${stringifyArgs(args, format)})` : 'integer';
};

const stringifyNumberSchema = (schema: NumberSchema, format: StringifyFormat): string => {
    const args = argifyBounds(schema, 'none');

    return (format.normalized || args.length) ? `number(${stringifyArgs(args, format)})` : 'number';
};

// NORMALIZED: string(of?: pattern, min?: number, xmin?: number, xmax?: number, max?: number, length?: number)
// PRETTY:    
//           string
//           string(LENGTH) - same as string(length: number) same as string(min: number; max: number) - where min === max
//           date|time|datetime|uuid|base64|email
//           date|time|datetime|uuid|base64|email()
//           date|time|datetime|uuid|base64|email(number)
//           date|time|datetime|uuid|base64|email(min?: number, xmin?: number, xmax?: number, max?: number, length?: number)
//           REGEXSTRING - /{pattern}/{flags} - only when no bounds, otherwise Normalized
const stringifyStringSchema = (schema: StringSchema, format: StringifyFormat): string => {
    let regex: RegexString | undefined;

    let pattern: StringSchemaFormat | undefined;

    if (schema.of)
        if (schema.of instanceof RegExp)
            regex = schema.of.toString() as RegexString;
        else if (isStringFormat(schema.of))
            pattern = schema.of;
        else
            regex = schema.of;

    const lengthArg = !format.normalized && pattern ? 'implicit' : 'explicit';

    const args = argifyBounds(schema, lengthArg);

    if (format.normalized || (regex && args.length)) {
        if (schema.of)
            args.unshift({ key: 'of', value: `"${regex ?? pattern!}"` });

        return `string(${stringifyArgs(args, format)})`;
    }
    else {
        let kind = regex ?? pattern ?? 'string';

        return args.length ? `${kind}(${stringifyArgs(args, format)})` : kind;
    }
};


// NORMALIZED: array(of: SCHEMA, min?: number, xmin?: number, xmax?: number, max?: number, length?: number)
// PRETTY:     SCHEMA[]
//             SCHEMA[LENGTH]
//             SCHEMA[min?: number, xmin?: number, xmax?: number, max?: number]
const stringifyArraySchema = (schema: ArraySchema, format: StringifyFormat): string => {
    const args = argifyBounds(schema, format.normalized ? 'explicit' : 'implicit');

    const of = stringifySchema(schema.of, format, true);

    if (format.normalized) {
        args.unshift({ key: 'of', value: of });
        return `array(${stringifyArgs(args, format)})`;
    }
    else {
        return `${of}[${stringifyArgs(args, format)}]`;
    }
};

// NORMALIZED: record(of: SCHEMA, key?: REGEXSTRING, min?: number, xmin?: number, xmax?: number, max?: number, length?: number)
// PRETTY:     SCHEMA{}
//             SCHEMA{LENGTH}
//             SCHEMA{key?: REGEXSTRING, min?: number, xmin?: number, xmax?: number, max?: number}
const stringifyRecordSchema = (schema: RecordSchema, format: StringifyFormat): string => {
    const args = argifyBounds(schema, !format.normalized && !schema.key ? 'implicit' : 'explicit');

    if (schema.key)
        args.unshift({ key: 'key', value: !format.normalized ? schema.key.toString() : `"${schema.key.toString()}"` });

    const of = stringifySchema(schema.of, format, true);

    if (!format.normalized) {
        return `${of}{${stringifyArgs(args, format)}}`;
    }
    else {
        args.unshift({ key: 'of', value: of });
        return `array(${stringifyArgs(args, format)})`;
    }
};

// NORMALIZED: tuple(of: [SCHEMAs], rest: REST)
// PRETTY:    [SCHEMAS]
//            [SCHEMAS, ...REST]
const stringifyTupleSchema = (schema: TupleSchema, format: StringifyFormat): string => {
    const ofs = schema.of.map(item => stringifySchema(item, format, false)).join(joiner(format));

    const rest = schema.rest ? stringifyArraySchema(schema.rest, format) : undefined;

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


// NORMALIZED: union(of: [])
// PRETTY:     X | Y | .. | Z
const stringifyUnionSchema = (schema: UnionSchema, format: StringifyFormat, enclosed: boolean): string => {
    const items = schema.of.map(item => stringify(item, format));

    if (!format.normalized) {
        const itemString = items.join(format.spacing ? ' | ' : '|');
        return enclosed ? `(${itemString})` : itemString;
    }
    else {
        return `union(${stringifyArgs([{ key: 'of', value: `[${items.join(joiner(format))}]` }], format)})`;
    }
};

// NORMALIZED: (...)
// PRETTY:     {...}
const stringifyStructSchema = (object: SchemaObject, format: StringifyFormat, level: number, optionals: boolean): string => {
    let indent = (format.indent ?? '');
    let newline = format.newline ?? '';
    let open = format.normalized ? '(' : '{';
    let close = format.normalized ? ')' : '}';
    let space = format.spacing ? ' ' : '';
    let optional = optionals ? '?:' : ':';

    let result = open + newline;

    for (const [key, value] of Object.entries(object)) {
        const stringified = stringifySchema(value, format, false, level + 1);
        result += indent.repeat(level + 1) + key + (value.isOptional ? optional : ':') + space + stringified + ',' + newline;
    }

    result += indent.repeat(level) + close + newline;

    return result;
};

const stringifyObjectSchema = (schema: ObjectSchema, format: StringifyFormat, level: number): string => {
    return stringifyStructSchema(schema.of, format, level, true);
};