import {
    ArraySchema, BoundedAttributes, GroupSchema, IntegerSchema,
    ModelSchema, NumberSchema, ObjectSchema, RecordSchema,
    Schema, SchemaObject, SizedAttributes, StringFormat,
    StringSchema, TupleSchema
} from '../Schema';
import { RegexString, Token, TokenScanner } from "../util";
import { JsonDefTypes } from "./JsonDefTypes";

export type Issue = { token: Token, message: string; };

export type Result<T> = ResultSuccess<T> | ResultFailure;
export type ResultSuccess<T> = { success: true, value: T; };

export type ResultFailure = { success: false, issues: Issue[]; };

const Result = {
    success: <T>(value: T): ResultSuccess<T> => ({ success: true, value }),
    failure: (issues: Issue[]): ResultFailure => ({ success: false, issues }),
    issue: (scanner: TokenScanner, message: string, issues?: Issue[]) =>
        Result.failure([...(issues ?? []), { token: scanner.peek()!, message }])
};


export const parseJsonDef = (data: Token[]): Result<Schema> => {
    const scanner = new TokenScanner(data);

    const result = parseSchemaUnion(scanner);

    if (!result.success)
        return result;

    if (!scanner.typeIs(JsonDefTypes.Eof))
        return Result.issue(scanner, 'Missing end of file');

    return result;
};

const parseSchemaUnion = (scanner: TokenScanner): Result<Schema> => {
    const schemas: Schema[] = [];

    if (scanner.typeIs(JsonDefTypes.Or))
        scanner.consume();

    while (true) {
        const result = parseSchema(scanner);

        if (result.success)
            schemas.push(result.value);
        else
            return result;

        if (scanner.typeIs(JsonDefTypes.Or))
            scanner.consume();
        else
            break;
    }

    if (schemas.length === 0)
        return Result.issue(scanner, 'Schema not found');
    else if (schemas.length === 1)
        return Result.success(schemas[0]);
    else
        return Result.success({ kind: 'union', of: schemas });
};

const parseSchema = (scanner: TokenScanner): Result<Schema> => {
    const result = parseSchemaItem(scanner);

    if (result.success) {
        if (scanner.typeIs(JsonDefTypes.ArrayOpen)) {
            scanner.consume();

            let size: SizedAttributes;

            if (scanner.typeIs(JsonDefTypes.ArrayClose)) {
                scanner.consume();
                size = {};
            }
            else {
                const sizeResult = parseSize(scanner);

                if (sizeResult.success) {
                    if (scanner.typeIs(JsonDefTypes.ArrayClose)) {
                        scanner.consume();
                        size = sizeResult.value;
                    }
                    else
                        return Result.issue(scanner, 'Missing array close');
                }
                else {
                    return sizeResult;
                }
            }

            const array: ArraySchema = { kind: 'array', of: result.value, ...size };

            return Result.success(array);
        }
        else {
            return result;
        }
    }
    else {
        return result;
    }
};

const parseSchemaItem = (scanner: TokenScanner): Result<Schema> => {
    switch (scanner.type()) {
        case JsonDefTypes.NullKeyword: {
            scanner.consume();
            return Result.success({ kind: 'null' });
        }
        case JsonDefTypes.AnyKeyword: {
            scanner.consume();
            return Result.success({ kind: 'any' });
        }
        case JsonDefTypes.BooleanKeyword: {
            scanner.consume();
            return Result.success({ kind: 'boolean' });
        }
        case JsonDefTypes.ThisKeyword: {
            scanner.consume();
            return Result.success({ kind: 'this' });
        }
        case JsonDefTypes.RootKeyword: {
            scanner.consume();
            return Result.success({ kind: 'root' });
        }
        case JsonDefTypes.TrueKeyword: {
            scanner.consume();
            return Result.success({ kind: 'literal', of: true });
        }
        case JsonDefTypes.FalseKeyword: {
            scanner.consume();
            return Result.success({ kind: 'literal', of: false });
        }
        case JsonDefTypes.Number:
        case JsonDefTypes.Integer:
        case JsonDefTypes.Real: {
            const value = scanner.value()!;
            scanner.consume();
            return Result.success({ kind: 'literal', of: Number.parseFloat(value) });
        }
        case JsonDefTypes.String: {
            const value = scanner.value()!;
            scanner.consume();
            return Result.success({ kind: 'literal', of: JSON.parse(`"${value.slice(1, -1)}"`) }); // HACK: Convert in lexe );
        }
        case JsonDefTypes.Identifier: {
            const value = scanner.value()!;
            scanner.consume();
            return Result.success({ kind: 'ref', of: value });
        }
        case JsonDefTypes.DateKeyword:
        case JsonDefTypes.TimeKeyword:
        case JsonDefTypes.DatetimeKeyword:
        case JsonDefTypes.UuidKeyword:
        case JsonDefTypes.Base64Keyword:
        case JsonDefTypes.EmailKeyword:
        case JsonDefTypes.Regex:
        case JsonDefTypes.StringKeyword: {
            return parseStringSchema(scanner);
        }
        case JsonDefTypes.IntegerKeyword: {
            return parseIntegerSchema(scanner);
        }
        case JsonDefTypes.NumberKeyword: {
            return parseNumberSchema(scanner);
        }

        case JsonDefTypes.ArrayOpen: {
            return parseTupleSchema(scanner);
        }
        case JsonDefTypes.RecordKeyword: {
            return parseRecordSchema(scanner);
        }
        case JsonDefTypes.ObjectOpen: {
            return parseObjectSchema(scanner);
        }
        case JsonDefTypes.ModelKeyword: {
            return parseModelSchema(scanner);
        }
        case JsonDefTypes.GroupKeyword: {
            return parseGroupSchema(scanner);
        }
        case JsonDefTypes.SelectKeyword: {
            return parseSelectSchema(scanner);
        }
        case JsonDefTypes.Open: {
            scanner.consume();
            const result = parseSchemaUnion(scanner);
            if (!result.success) return result;
            if (scanner.typeIs(JsonDefTypes.Close)) {
                scanner.consume();
                return result;
            }
            else {
                return Result.issue(scanner, 'Missing closing parenthesis');
            }
        }
    }

    return Result.issue(scanner, 'Schema not found');
};


const numberSet = new Set<number>([JsonDefTypes.Number]);

const integerSet = new Set<number>([JsonDefTypes.Number, JsonDefTypes.Integer]);

const realSet = new Set<number>([JsonDefTypes.Number, JsonDefTypes.Integer, JsonDefTypes.Real]);


const parseIntegerSchema = (scanner: TokenScanner): Result<IntegerSchema> => {
    scanner.consume();

    let bounds: BoundedAttributes = {};

    if (scanner.typeIs(JsonDefTypes.Open)) {
        scanner.consume();

        const boundsResult = parseBounds(scanner, integerSet);

        if (boundsResult.success) {
            bounds = boundsResult.value;

            if (scanner.typeIs(JsonDefTypes.Close))
                scanner.consume();
            else
                return Result.issue(scanner, 'Missing bounds close');
        }
        else
            return boundsResult;
    }

    return Result.success({ kind: 'integer', ...bounds });
};

const parseNumberSchema = (scanner: TokenScanner): Result<NumberSchema> => {
    scanner.consume();

    let bounds: BoundedAttributes = {};

    if (scanner.typeIs(JsonDefTypes.Open)) {
        scanner.consume();

        const boundsResult = parseBounds(scanner, realSet);

        if (boundsResult.success) {
            bounds = boundsResult.value;

            if (scanner.typeIs(JsonDefTypes.Close))
                scanner.consume();
            else
                return Result.issue(scanner, 'Missing bounds close');
        }
        else
            return boundsResult;
    }

    return Result.success({ kind: 'number', ...bounds });
};

const parseStringSchema = (scanner: TokenScanner): Result<StringSchema> => {
    const value = scanner.value()!;

    const of = value === 'string' ? {} : { of: value as StringFormat | RegexString };

    scanner.consume();

    let size: SizedAttributes = {};

    if (scanner.typeIs(JsonDefTypes.Open)) {
        scanner.consume();

        const sizeResult = parseSize(scanner);

        if (sizeResult.success) {
            size = sizeResult.value;

            if (scanner.typeIs(JsonDefTypes.Close))
                scanner.consume();
            else
                return Result.issue(scanner, 'Missing bounds close');
        }
        else
            return sizeResult;
    }

    return Result.success({ kind: 'string', ...size, ...of });
};

const parseTupleSchema = (scanner: TokenScanner): Result<TupleSchema> => {
    scanner.consume();

    let schemas: Schema[] = [];
    let rest: Schema | undefined;

    while (true) {
        if (scanner.typeIs(JsonDefTypes.Rest)) {

            scanner.consume();

            const restResult = parseSchema(scanner);

            if (restResult.success) {
                if (restResult.value.kind !== 'array')
                    return Result.issue(scanner, 'Rest Schema must be an array');

                rest = restResult.value;

                if (scanner.typeIs(JsonDefTypes.Comma))
                    scanner.consume();

                break;
            }
            else {
                return Result.issue(scanner, 'Missing rest schema', restResult.issues);
            }
        }
        else if (scanner.typeIs(JsonDefTypes.ArrayClose)) {
            break;
        }
        else {
            const schemaResult = parseSchema(scanner);

            if (schemaResult.success) {
                schemas.push(schemaResult.value);
            }

            if (scanner.typeIs(JsonDefTypes.Comma))
                scanner.consume();
        }
    }

    if (!scanner.typeIs(JsonDefTypes.ArrayClose))
        return Result.issue(scanner, 'Missing tuple end');

    scanner.consume();

    return Result.success({ kind: 'tuple', of: schemas, ...(rest ? { rest: rest as ArraySchema } : {}) });
};

const parseRecordSchema = (scanner: TokenScanner): Result<RecordSchema> => {
    scanner.consume();

    if (!scanner.typeIs(JsonDefTypes.GenericOpen))
        return Result.issue(scanner, `Expecting '<'`);

    scanner.consume();

    const first = parseSchemaUnion(scanner);
    let last: Result<Schema> | undefined;
    let size: SizedAttributes = {};

    if (!first.success)
        return first;

    if (scanner.typeIs(JsonDefTypes.Comma)) {
        if (first.value.kind !== 'string')
            return Result.issue(scanner, 'Record key must be a string schema');

        scanner.consume();

        last = parseSchemaUnion(scanner);

        if (!last.success)
            return last;
    }

    if (scanner.typeIs(JsonDefTypes.GenericClose))
        scanner.consume();
    else
        return Result.issue(scanner, `Expecting '>'`);


    if (scanner.typeIs(JsonDefTypes.Open)) {
        scanner.consume();

        const sizeResult = parseSize(scanner);

        if (!sizeResult.success)
            return sizeResult;

        size = sizeResult.value;

        if (scanner.typeIs(JsonDefTypes.Close))
            scanner.consume();
        else
            return Result.issue(scanner, `Expecting ')'`);

    }


    return Result.success(last && last.success
        ? { kind: 'record', of: last.value, key: first.value as StringSchema, ...size }
        : { kind: 'record', of: first.value, ...size });
};

const parseStructItem = (scanner: TokenScanner, optional: boolean): Result<{ key: string, schema: Schema; }> | null => {
    let key: string;

    if (scanner.typeIs(JsonDefTypes.Identifier)) {
        key = scanner.value()!;
        scanner.consume();
    }
    else if (scanner.typeIs(JsonDefTypes.String)) {
        key = scanner.value()!.slice(1, -1);
        scanner.consume();
    }
    else {
        return null;
    }

    let isOptional = {};

    if (scanner.typeIs(JsonDefTypes.RequiredIs)) {
        scanner.consume();
    }
    else if (scanner.typeIs(JsonDefTypes.OptionalIs)) {
        if (!optional)
            return Result.issue(scanner, 'Optional definitions not allowed');

        isOptional = { isOptional: true };

        scanner.consume();
    }
    else {
        return Result.issue(scanner, `Expected ${optional ? `':' or '?:'` : `':`}`);
    }

    const schema = parseSchemaUnion(scanner);

    if (schema.success)
        return Result.success({ key, schema: { ...schema.value, ...isOptional } });
    else
        return schema;
};

const parseStruct = (scanner: TokenScanner, optional: boolean): Result<SchemaObject> => {
    if (!scanner.consumeIfType(JsonDefTypes.ObjectOpen))
        return Result.issue(scanner, `Expected '{'`);

    let result: SchemaObject = {};

    while (true) {
        const item = parseStructItem(scanner, optional);

        if (item === null)
            break;
        else if (!item.success)
            return item;

        result[item.value.key] = item.value.schema;

        if (!scanner.consumeIfType(JsonDefTypes.Comma))
            break;
    }

    if (!scanner.consumeIfType(JsonDefTypes.ObjectClose))
        return Result.issue(scanner, `Expected '}'`);

    return Result.success(result);
};

const parseObjectSchema = (scanner: TokenScanner): Result<ObjectSchema> => {
    const result = parseStruct(scanner, true);

    return result.success ? Result.success({ kind: 'object', of: result.value }) : result;
};

const parseModelSchema = (scanner: TokenScanner): Result<ModelSchema> => {
    // Consume ModelKeyword
    scanner.consume();

    const result = parseStruct(scanner, true);

    return result.success ? Result.success({ kind: 'model', of: result.value }) : result;
};

const parseSelectSchema = (scanner: TokenScanner): Result<GroupSchema> => {
    // Consume SelectKeyword
    scanner.consume();

    let selected: string;

    if (scanner.typeIs(JsonDefTypes.Identifier)) {
        selected = scanner.value()!;
        scanner.consume()
    }
    else if (scanner.typeIs(JsonDefTypes.String)){
        selected = scanner.value()!.slice(1, -1);
        scanner.consume()
    }
    else
        return Result.issue(scanner, 'Missing selected name');

    if (!scanner.consumeIfType(JsonDefTypes.OfKeyword))
        return Result.issue(scanner, `Expected 'of'`);

    if (!scanner.consumeIfType(JsonDefTypes.GroupKeyword))
        return Result.issue(scanner, `Expected 'group'`);

    const result = parseStruct(scanner, false);

    if (result.success) {
        if ((selected in result.value))
            return Result.success({ kind: 'group', of: result.value, selected });
        else
            return Result.issue(scanner, `Group member '${selected}' does not exist`);
    }
    else {
        return result;
    }
};

const parseGroupSchema = (scanner: TokenScanner): Result<GroupSchema> => {
    // Consume GroupKeyword
    scanner.consume();

    const result = parseStruct(scanner, false);

    return result.success ? Result.success({ kind: 'group', of: result.value }) : result;
};



const exactMap = new Map<number, { key: keyof SizedAttributes, other?: keyof SizedAttributes; }>([[JsonDefTypes.Exactly, { key: 'exact' }]]);

const boundsMap = new Map<number, { key: keyof SizedAttributes, other?: keyof SizedAttributes; }>([
    [JsonDefTypes.GreaterThan, { key: 'xmin', other: 'min' }],
    [JsonDefTypes.GreaterThanOrEqual, { key: 'min', other: 'xmin' }],
    [JsonDefTypes.LessThan, { key: 'xmax', other: 'max' }],
    [JsonDefTypes.LessThanOrEqual, { key: 'max', other: 'xmax' }],
]);

const parseBound = (scanner: TokenScanner,
    map: Map<number, { key: keyof SizedAttributes, other?: keyof SizedAttributes; }>,
    valueType: Set<number>,
    previous: SizedAttributes = {}
): Result<Partial<Record<keyof SizedAttributes, number>>> | null => {
    let info = map.get(scanner.type()!);

    if (info) {
        if (info.key in previous)
            return Result.issue(scanner, `${info.key} already defined`);
        if (info.other && info.other in previous)
            return Result.issue(scanner, `${info.other} already defined`);

        scanner.consume();

        if (scanner.typeIn(valueType)) {
            const value = scanner.value()!;

            scanner.consume();

            return Result.success({ ...previous, [info.key]: Number.parseFloat(value) });
        }
        else {
            return Result.issue(scanner, `Missing ${info} size number`);
        }
    }

    return null;
};

const parseSize = (scanner: TokenScanner): Result<SizedAttributes> => {
    let result = parseBound(scanner, exactMap, numberSet);

    if (result === null)
        result = parseBounds(scanner, numberSet);

    return result === null ? Result.success({}) : result;
};


const parseBounds = (scanner: TokenScanner, type: Set<number>): Result<BoundedAttributes> => {
    let previous: BoundedAttributes = {};

    let result = parseBound(scanner, boundsMap, type, previous);

    if (result !== null) {
        if (!result.success) return result;

        previous = result.value;

        if (scanner.typeIs(JsonDefTypes.And)) {
            scanner.consume();

            let result = parseBound(scanner, boundsMap, type, previous);

            if (result === null)
                return Result.issue(scanner, 'Missing Bound');
            else if (!result.success)
                return result;
            else
                previous = { ...previous, ...result.value };
        }
    }

    return Result.success(previous);
};