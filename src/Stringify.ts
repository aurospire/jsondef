import { isStringFormat } from "./isStringFormat";
import {
    AnySchema, ArraySchema, BooleanSchema, BoundedAttributes, GroupSchema,
    IntegerSchema, LiteralSchema, ModelSchema, NullSchema,
    NumberSchema, ObjectSchema, RecordSchema, RefSchema,
    RootSchema, Schema, SchemaObject, SizedAttributes, StringSchema, StringSchemaFormat, ThisSchema,
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

type Arg = { key?: string, symbol?: string, value: string; };

const stringifyArgs = (args: Arg[], format: StringifyFormat, separator: string = ':'): string => {
    const space = format.spacing ? ' ' : '';

    return args.map(({ key, symbol, value }) => {
        return key ? `${key}${separator}${space}${value}` : symbol ? `${symbol}${space}${value}` : value;
    }).join(joiner(format));
};

// type bounds = { min?: number; xmin?: number; xmax?: number; max?: number; }
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

        case 'array': return stringifyArraySchema(schema as ArraySchema, format, level);
        case 'tuple': return stringifyTupleSchema(schema as TupleSchema, format, level);
        case 'record': return stringifyRecordSchema(schema as RecordSchema, format, level);

        case 'union': return stringifyUnionSchema(schema as UnionSchema, format, level, enclosed);

        case 'object': return stringifyObjectSchema(schema as ObjectSchema, format, level);
        case 'model': return stringifyModelSchema(schema as ModelSchema, format, level);
        case 'group': return stringifyGroupSchema(schema as GroupSchema, format, level);
    }
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

const stringifyString = (value: string, format: StringifyFormat) => {
    const escaped = JSON.stringify(value);
    return format.normalized ? escaped : `'${escaped.slice(1, -1)}'`;
};

const stringifyLiteralSchema = (schema: LiteralSchema, format: StringifyFormat): string => {
    switch (typeof schema.of) {
        case 'number':
        case 'boolean':
            return schema.of.toString();
        case 'string':
            return stringifyString(schema.of, format);
    }
};

const stringifyIntegerSchema = (schema: IntegerSchema, format: StringifyFormat): string => {
    const args = argifyBounds(schema, format);

    return (format.normalized || args.length) ? `integer(${stringifyArgs(args, format, '')})` : 'integer';
};

const stringifyNumberSchema = (schema: NumberSchema, format: StringifyFormat): string => {
    const args = argifyBounds(schema, format);

    return (format.normalized || args.length) ? `number(${stringifyArgs(args, format, '')})` : 'number';
};

// NORMALIZED: string(of?: pattern, min?: number, xmin?: number, xmax?: number, max?: number, len?: number)
// PRETTY:    
//           string
//           string(LENGTH) - same as string(length: number) same as string(min: number; max: number) - where min === max
//           date|time|datetime|uuid|base64|email
//           date|time|datetime|uuid|base64|email()
//           date|time|datetime|uuid|base64|email(number)
//           date|time|datetime|uuid|base64|email(min?: number, xmin?: number, xmax?: number, max?: number, len?: number)
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

    const args = argifyBounds(schema, format);

    if (format.normalized || (regex && args.length)) {
        if (schema.of)
            args.unshift({ key: 'of', value: stringifyString(regex ?? pattern!, format) });

        return `string(${stringifyArgs(args, format)})`;
    }
    else {
        let kind = regex ?? pattern ?? 'string';

        return args.length ? `${kind}(${stringifyArgs(args, format)})` : kind;
    }
};


// NORMALIZED: array(of: SCHEMA, min?: number, xmin?: number, xmax?: number, max?: number, len?: number)
// PRETTY:     SCHEMA[]
//             SCHEMA[LENGTH]
//             SCHEMA[min?: number, xmin?: number, xmax?: number, max?: number]
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

// NORMALIZED: record(of: SCHEMA, key?: REGEXSTRING, min?: number, xmin?: number, xmax?: number, max?: number, len?: number)
// PRETTY:
//             record<OF>
//             record<OF>(LENGTH)
//             record<OF>(bounds)
//             record<KEY, OF>
//             record<KEY, OF>(LENGTH)
//             record<KEY, OF>(BOUNDS)
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

// NORMALIZED: tuple(of: [SCHEMAs], rest: REST)
// PRETTY:    [SCHEMAS]
//            [SCHEMAS, ...REST]
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


// NORMALIZED: union(of: [])
// PRETTY:     X | Y | .. | Z
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

    result += indent.repeat(level) + close;

    return result;
};

const stringifyObjectSchema = (schema: ObjectSchema, format: StringifyFormat, level: number): string => {
    const struct = stringifyStructSchema(schema.of, format, level, true);

    return (format.normalized ? 'object' : '') + struct;
};

const stringifyModelSchema = (schema: ModelSchema, format: StringifyFormat, level: number): string => {
    const struct = stringifyStructSchema(schema.of, format, level, true);

    return (format.normalized ? 'model' : 'model' + (format.spacing ? ' ' : '')) + struct;
};

const stringifyGroupSchema = (schema: GroupSchema, format: StringifyFormat, level: number): string => {
    const struct = stringifyStructSchema(schema.of, format, level, false);

    const selected = schema.selected ? `select ${schema.selected} of ` : '';

    return selected + (format.normalized ? 'group' : 'group' + (format.spacing ? ' ' : '')) + struct;
};