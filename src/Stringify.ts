import { isStringFormat } from "./isStringFormat";
import {
    AnySchema, ArraySchema, BooleanSchema, BoundedAttributes, GroupSchema,
    IntegerSchema, LiteralSchema, ModelSchema, NullSchema,
    NumberSchema, ObjectSchema, RecordSchema, RefSchema,
    RootSchema, Schema, StringSchema, StringSchemaFormat, ThisSchema,
    TupleSchema, UnionSchema
} from "./Schema";
import { RegexString } from "./util";


export type StringifyFormat = {
    indent?: string;
    newline?: string;
    spacing?: boolean;
    condensed?: boolean;
};

export const PrettyStringifyFormat = (format: StringifyFormat = {}): StringifyFormat => ({
    indent: '  ',
    newline: '\n',
    spacing: true,
    condensed: true,
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

const stringifySchema = (schema: Schema, format: StringifyFormat, enclosed: boolean = false): string => {
    switch (schema.kind) {
        case 'null': return stringifyNullSchema(schema as NullSchema, format);
        case 'any': return stringifyAnySchema(schema as AnySchema, format);
        case 'boolean': return stringifyBooleanSchema(schema as BooleanSchema, format);
        case 'integer': return stringifyIntegerSchema(schema as IntegerSchema, format);
        case 'number': return stringifyNumberSchema(schema as NumberSchema, format);
        case 'literal': return stringifyLiteralSchema(schema as LiteralSchema, format);
        case 'string': return stringifyStringSchema(schema as StringSchema, format);
        case 'array': return stringifyArraySchema(schema as ArraySchema, format);
        case 'tuple': return stringifyTupleSchema(schema as TupleSchema, format);
        case 'record': return stringifyRecordSchema(schema as RecordSchema, format);
    }
    return '';
    // TupleSchema;
    // UnionSchema;
    // ObjectSchema;
    // ModelSchema;
    // GroupSchema;
    // RefSchema;
    // RootSchema;
    // ThisSchema;
};

const stringifyNullSchema = (schema: NullSchema, format: StringifyFormat): string => {
    return format.condensed ? 'null' : 'null()';
};

const stringifyAnySchema = (schema: AnySchema, format: StringifyFormat): string => {
    return format.condensed ? 'any' : 'any()';
};

const stringifyBooleanSchema = (schema: BooleanSchema, format: StringifyFormat): string => {
    return format.condensed ? 'boolean' : 'boolean()';
};

const stringifyLiteralSchema = (schema: LiteralSchema, format: StringifyFormat): string => {
    return JSON.stringify(schema.of);
};


const stringifyIntegerSchema = (schema: IntegerSchema, format: StringifyFormat): string => {
    const args = argifyBounds(schema, 'none');

    return (format.condensed && !args.length) ? 'integer' : `integer(${stringifyArgs(args, format)})`;
};

const stringifyNumberSchema = (schema: NumberSchema, format: StringifyFormat): string => {
    const args = argifyBounds(schema, 'none');

    return (format.condensed && !args.length) ? 'number' : `number(${stringifyArgs(args, format)})`;
};

// NORMALIZED: string(of?: pattern, min?: number, xmin?: number, xmax?: number, max?: number, length?: number)
// CONDENSED: 
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

    const lengthArg = format.condensed && pattern ? 'implicit' : 'explicit';

    const args = argifyBounds(schema, lengthArg);

    if (!format.condensed || (regex && args.length)) {
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
// CONDENSED:  SCHEMA[]
//             SCHEMA[LENGTH]
//             SCHEMA[min?: number, xmin?: number, xmax?: number, max?: number]
// CONDENSED?: array(SCHEMA)
//             array(SCHEMA, LENGTH)
//             SCHEMA[min?: number, xmin?: number, xmax?: number, max?: number]
const stringifyArraySchema = (schema: ArraySchema, format: StringifyFormat): string => {
    const args = argifyBounds(schema, format.condensed ? 'implicit' : 'explicit');

    const of = stringifySchema(schema.of, format, true);

    if (format.condensed) {
        return `${of}[${stringifyArgs(args, format)}]`;
    }
    // if (format.condensed && args.length <= 1 && !args[0]?.key) {

    //     args.unshift({ value: of });
    //     return `array(${stringifyArgs(args, format)})`;
    // }
    else {
        args.unshift({ key: 'of', value: of });
        return `array(${stringifyArgs(args, format)})`;
    }
};

// NORMALIZED: record(of: SCHEMA, key?: REGEXSTRING, min?: number, xmin?: number, xmax?: number, max?: number, length?: number)
// CONDENSED:  SCHEMA{}
//             SCHEMA{LENGTH}
//             SCHEMA{key?: REGEXSTRING, min?: number, xmin?: number, xmax?: number, max?: number}
const stringifyRecordSchema = (schema: RecordSchema, format: StringifyFormat): string => {
    const args = argifyBounds(schema, format.condensed && !schema.key ? 'implicit' : 'explicit');

    if (schema.key)
        args.unshift({ key: 'key', value: format.condensed ? schema.key.toString() : `"${schema.key.toString()}"` });

    const of = stringifySchema(schema.of, format, true);

    if (format.condensed) {
        return `${of}{${stringifyArgs(args, format)}}`;
    }
    else {
        args.unshift({ key: 'of', value: of });
        return `array(${stringifyArgs(args, format)})`;
    }
};

// NORMALIZED: tuple(of: [SCHEMAs], rest: REST)
// CONDENSED: [SCHEMAS]
//            [SCHEMAS, ...REST]
const stringifyTupleSchema = (schema: TupleSchema, format: StringifyFormat): string => {
    const ofs = schema.of.map(item => stringifySchema(item, format, false)).join(joiner(format));

    const rest = schema.rest ? stringifySchema(schema.rest, format, false) : undefined;

    if (format.condensed) {
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