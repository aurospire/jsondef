import {
    ArraySchema, BoundedAttributes, GroupSchema, IntegerSchema,
    ModelSchema, NumberSchema, ObjectSchema, RecordSchema,
    Schema, SchemaObject, SizedAttributes, StringFormat,
    StringSchema, TupleSchema
} from '../Schema';
import { RegexString, Token, TokenScanner } from "../util";
import { Result, ResultFailure, ResultSuccess } from '../util/Result';
import { JsonDefTypes } from "./JsonDefTypes";

const issue = (scanner: TokenScanner, message: string) =>
    Result.failure<Token>([{
        on: scanner.peek() ?? {
            type: -1,
            mark: scanner.peek(-1)?.mark ?? { position: 0, line: 0, column: 0 },
            length: 0,
            value: ''
        },
        message
    }]);

export const IssueType = (scanner: TokenScanner) => ({
    UNEXPECTED_EOF: (): ResultFailure<Token> => issue(scanner, 'Unexpected end of input'),
    EXPECTED: (...expected: (string | undefined)[]): ResultFailure<Token> => issue(scanner, `Expected ${expected.filter(Boolean).join(' or ')}`),
    EXPECTED_SYMBOL: (...expected: (string | undefined)[]): ResultFailure<Token> => issue(scanner, `Expected ${expected.filter(Boolean).map(i => `'${i}'`).join(' or ')}`),
    MUST_BE: (name: string, type: string): ResultFailure<Token> => issue(scanner, `${name} must be ${type}`),
    SELECTED_NOT_FOUND: (name: string): ResultFailure<Token> => issue(scanner, `Selected '${name}' is not in a schema in group`),
    DUPLICATE_FIELD: (field: string): ResultFailure<Token> => issue(scanner, `Duplicate field: ${field}`),
    BOUND_ALREADY_DEFINED: (bound: string) => issue(scanner, `Bound ${bound} already defined`),
} as const);

export const parseJsonDef = (data: Token[]): Result<Schema, Token> => {
    const scanner = new TokenScanner(data);

    const result = parseSchemaUnion(scanner);

    if (!result.success)
        return result;

    if (!scanner.is(JsonDefTypes.Eof))
        return IssueType(scanner).UNEXPECTED_EOF();

    return result;
};

const parseSchemaUnion = (scanner: TokenScanner): Result<Schema, Token> => {
    const schemas: Schema[] = [];

    if (scanner.is(JsonDefTypes.Or))
        scanner.consume();

    while (true) {
        const result = parseSchema(scanner);

        if (result.success)
            schemas.push(result.value);
        else
            return result;

        if (scanner.consumeIf(JsonDefTypes.Or))
            break;
    }

    if (schemas.length === 0)
        return IssueType(scanner).EXPECTED('Schema');
    else if (schemas.length === 1)
        return Result.success(schemas[0]);
    else
        return Result.success({ kind: 'union', of: schemas });
};

const parseSchema = (scanner: TokenScanner): Result<Schema, Token> => {
    const result = parseSchemaItem(scanner);

    if (result.success) {
        if (scanner.consumeIf(JsonDefTypes.ArrayOpen)) {

            let size: SizedAttributes;

            if (scanner.consumeIf(JsonDefTypes.ArrayClose)) {
                size = {};
            }
            else {
                const sizeResult = parseSize(scanner);

                if (sizeResult.success) {
                    if (scanner.consumeIf(JsonDefTypes.ArrayClose))
                        size = sizeResult.value;
                    else
                        return IssueType(scanner).EXPECTED_SYMBOL(')');
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

const simpleSchema = (scanner: TokenScanner, kind: Schema['kind'], of?: any): ResultSuccess<Schema> => {
    scanner.consume(); return Result.success({ kind, ...(of ? { of } : {}) });
};

const parseSchemaItem = (scanner: TokenScanner): Result<Schema, Token> => {
    switch (scanner.type()) {
        case JsonDefTypes.NullKeyword:
        case JsonDefTypes.AnyKeyword:
        case JsonDefTypes.BooleanKeyword:
        case JsonDefTypes.ThisKeyword:
        case JsonDefTypes.RootKeyword:
            return simpleSchema(scanner, scanner.value()! as Schema['kind']);
        case JsonDefTypes.TrueKeyword:
            return simpleSchema(scanner, 'literal', true);
        case JsonDefTypes.FalseKeyword:
            return simpleSchema(scanner, 'literal', false);
        case JsonDefTypes.Number:
        case JsonDefTypes.Integer:
        case JsonDefTypes.Real:
            return simpleSchema(scanner, 'literal', Number.parseFloat(scanner.value()!));
        case JsonDefTypes.String: 
            return simpleSchema(scanner, 'literal', JSON.parse(`"${scanner.value()!.slice(1, -1)}"`)); // Hack to convert escapes            
        case JsonDefTypes.Identifier:
            return simpleSchema(scanner, 'ref', scanner.value()!);
        case JsonDefTypes.DateKeyword:
        case JsonDefTypes.TimeKeyword:
        case JsonDefTypes.DatetimeKeyword:
        case JsonDefTypes.UuidKeyword:
        case JsonDefTypes.Base64Keyword:
        case JsonDefTypes.EmailKeyword:
        case JsonDefTypes.Regex:
        case JsonDefTypes.StringKeyword:
            return parseStringSchema(scanner);
        case JsonDefTypes.IntegerKeyword:
        case JsonDefTypes.NumberKeyword:
            return parseNumericSchema(scanner);
        case JsonDefTypes.ArrayOpen:
            return parseTupleSchema(scanner);
        case JsonDefTypes.RecordKeyword:
            return parseRecordSchema(scanner);
        case JsonDefTypes.ObjectOpen:
            return parseObjectSchema(scanner);
        case JsonDefTypes.ModelKeyword:
            return parseModelSchema(scanner);
        case JsonDefTypes.GroupKeyword:
            return parseGroupSchema(scanner);
        case JsonDefTypes.SelectKeyword:
            return parseSelectSchema(scanner);
        case JsonDefTypes.Open: {
            scanner.consume();

            const result = parseSchemaUnion(scanner);

            if (!result.success) return result;

            return scanner.consumeIf(JsonDefTypes.Close)
                ? result
                : IssueType(scanner).EXPECTED_SYMBOL(')');
        }
    }

    return IssueType(scanner).EXPECTED('Schema');
};


const numberSet = new Set<number>([JsonDefTypes.Number]);

const integerSet = new Set<number>([JsonDefTypes.Number, JsonDefTypes.Integer]);

const realSet = new Set<number>([JsonDefTypes.Number, JsonDefTypes.Integer, JsonDefTypes.Real]);


const parseNumericSchema = (scanner: TokenScanner): Result<IntegerSchema | NumberSchema, Token> => {
    const kind = scanner.value()! as 'number' | 'integer';

    let bounds: BoundedAttributes = {};

    if (scanner.consumeIf(JsonDefTypes.Open)) {
        const boundsResult = parseBounds(scanner, kind === 'integer' ? integerSet : realSet);

        if (boundsResult.success) {
            bounds = boundsResult.value;

            if (!scanner.consumeIf(JsonDefTypes.Close))
                return IssueType(scanner).EXPECTED_SYMBOL(')');
        }
        else
            return boundsResult;
    }

    return Result.success({ kind, ...bounds });
};

const parseStringSchema = (scanner: TokenScanner): Result<StringSchema, Token> => {
    const value = scanner.value()!;

    const of = value === 'string' ? {} : { of: value as StringFormat | RegexString };

    scanner.consume();

    let size: SizedAttributes = {};

    if (scanner.consumeIf(JsonDefTypes.Open)) {
        const sizeResult = parseSize(scanner);

        if (sizeResult.success) {
            size = sizeResult.value;

            if (!scanner.consumeIf(JsonDefTypes.Close))
                return IssueType(scanner).EXPECTED_SYMBOL(')');
        }
        else
            return sizeResult;
    }

    return Result.success({ kind: 'string', ...size, ...of });
};

const parseTupleSchema = (scanner: TokenScanner): Result<TupleSchema, Token> => {
    scanner.consume();

    let schemas: Schema[] = [];
    let rest: Schema | undefined;

    while (true) {
        if (scanner.consumeIf(JsonDefTypes.Rest)) {
            const restResult = parseSchema(scanner);

            if (restResult.success) {
                if (restResult.value.kind !== 'array')
                    return IssueType(scanner).MUST_BE('Rest Schema', 'an Array Schema');

                rest = restResult.value;

                scanner.consumeIf(JsonDefTypes.Comma);

                break;
            }
            else {
                return IssueType(scanner).EXPECTED('Rest Schema');
            }
        }
        else if (scanner.is(JsonDefTypes.ArrayClose)) {
            break;
        }
        else {
            const schemaResult = parseSchema(scanner);

            if (schemaResult.success)
                schemas.push(schemaResult.value);

            scanner.consumeIf(JsonDefTypes.Comma);
        }
    }

    if (!scanner.consumeIf(JsonDefTypes.ArrayClose))
        return IssueType(scanner).EXPECTED_SYMBOL(']');


    return Result.success({ kind: 'tuple', of: schemas, ...(rest ? { rest: rest as ArraySchema } : {}) });
};

const parseRecordSchema = (scanner: TokenScanner): Result<RecordSchema, Token> => {
    scanner.consume();

    if (!scanner.consumeIf(JsonDefTypes.GenericOpen))
        return IssueType(scanner).EXPECTED_SYMBOL('<');

    const keyOrValue = parseSchemaUnion(scanner);
    let value: Result<Schema, Token> | undefined;
    let size: SizedAttributes = {};

    if (!keyOrValue.success)
        return keyOrValue;

    if (scanner.consumeIf(JsonDefTypes.Comma)) {
        if (keyOrValue.value.kind !== 'string')
            return IssueType(scanner).MUST_BE('Record Key', 'String Schema');

        value = parseSchemaUnion(scanner);

        if (!value.success)
            return value;
    }

    if (!scanner.consumeIf(JsonDefTypes.GenericClose))
        return IssueType(scanner).EXPECTED_SYMBOL('>');


    if (scanner.consumeIf(JsonDefTypes.Open)) {
        const sizeResult = parseSize(scanner);

        if (!sizeResult.success)
            return sizeResult;

        size = sizeResult.value;

        if (!scanner.consumeIf(JsonDefTypes.Close))
            return IssueType(scanner).EXPECTED_SYMBOL(')');

    }

    return Result.success(value && value.success
        ? { kind: 'record', of: value.value, key: keyOrValue.value as StringSchema, ...size }
        : { kind: 'record', of: keyOrValue.value, ...size });
};

const parseStructItem = (scanner: TokenScanner, optional: boolean): Result<{ key: string, schema: Schema; }, Token> | null => {
    let key: string;

    if (scanner.is(JsonDefTypes.Identifier)) {
        key = scanner.value()!;
        scanner.consume();
    }
    else if (scanner.is(JsonDefTypes.String)) {
        key = scanner.value()!.slice(1, -1);
        scanner.consume();
    }
    else {
        return null;
    }

    let isOptional = {};

    if (scanner.is(JsonDefTypes.RequiredIs)) {
        scanner.consume();
    }
    else if (scanner.is(JsonDefTypes.OptionalIs)) {
        if (!optional)
            return IssueType(scanner).EXPECTED_SYMBOL(':');

        isOptional = { isOptional: true };

        scanner.consume();
    }
    else {
        return IssueType(scanner).EXPECTED_SYMBOL(':', optional ? '?:' : undefined);
    }

    const schema = parseSchemaUnion(scanner);

    if (schema.success)
        return Result.success({ key, schema: { ...schema.value, ...isOptional } });
    else
        return schema;
};

const parseStruct = (scanner: TokenScanner, optional: boolean): Result<SchemaObject, Token> => {
    if (!scanner.consumeIf(JsonDefTypes.ObjectOpen))
        return IssueType(scanner).EXPECTED_SYMBOL('{');


    let result: SchemaObject = {};

    while (true) {
        const item = parseStructItem(scanner, optional);

        if (item === null)
            break;
        else if (!item.success)
            return item;

        result[item.value.key] = item.value.schema;

        if (!scanner.consumeIf(JsonDefTypes.Comma))
            break;
    }

    if (!scanner.consumeIf(JsonDefTypes.ObjectClose))
        return IssueType(scanner).EXPECTED_SYMBOL('}');

    return Result.success(result);
};

const parseObjectSchema = (scanner: TokenScanner): Result<ObjectSchema, Token> => {
    const result = parseStruct(scanner, true);

    return result.success ? Result.success({ kind: 'object', of: result.value }) : result;
};

const parseModelSchema = (scanner: TokenScanner): Result<ModelSchema, Token> => {
    // Consume ModelKeyword
    scanner.consume();

    const result = parseStruct(scanner, true);

    return result.success ? Result.success({ kind: 'model', of: result.value }) : result;
};

const parseGroupSchema = (scanner: TokenScanner): Result<GroupSchema, Token> => {
    // Consume GroupKeyword
    scanner.consume();

    const result = parseStruct(scanner, false);

    return result.success ? Result.success({ kind: 'group', of: result.value }) : result;
};

const parseSelectSchema = (scanner: TokenScanner): Result<GroupSchema, Token> => {
    // Consume SelectKeyword
    scanner.consume();

    let selected: string = scanner.value()!;

    // Get Selected Name
    if (scanner.consumeIf(JsonDefTypes.String))
        selected = selected.slice(1, -1);
    else if (!scanner.consumeIf(JsonDefTypes.Identifier))
        return IssueType(scanner).EXPECTED('Selected name');

    if (!scanner.consumeIf(JsonDefTypes.OfKeyword))
        return IssueType(scanner).EXPECTED_SYMBOL('of');

    if (!scanner.consumeIf(JsonDefTypes.GroupKeyword))
        return IssueType(scanner).EXPECTED_SYMBOL('group');

    const result = parseStruct(scanner, false);

    if (result.success) {
        if (selected in result.value)
            return Result.success({ kind: 'group', of: result.value, selected });
        else
            return IssueType(scanner).SELECTED_NOT_FOUND(selected);
    }
    else {
        return result;
    }
};


type BoundsMap = Map<number, { key: keyof SizedAttributes, other?: keyof SizedAttributes; }>;

const exactMap: BoundsMap = new Map([[JsonDefTypes.Exactly, { key: 'exact' }]]);

const boundsMap: BoundsMap = new Map([
    [JsonDefTypes.GreaterThan, { key: 'xmin', other: 'min' }],
    [JsonDefTypes.GreaterThanOrEqual, { key: 'min', other: 'xmin' }],
    [JsonDefTypes.LessThan, { key: 'xmax', other: 'max' }],
    [JsonDefTypes.LessThanOrEqual, { key: 'max', other: 'xmax' }],
]);

const parseBound = (scanner: TokenScanner, map: BoundsMap, valueType: Set<number>, previous: SizedAttributes = {})
    : Result<SizedAttributes, Token> | null => {

    let info = map.get(scanner.type()!);

    if (info) {
        if (info.key in previous)
            return IssueType(scanner).BOUND_ALREADY_DEFINED(info.key);
        if (info.other && info.other in previous)
            return IssueType(scanner).BOUND_ALREADY_DEFINED(info.other);

        scanner.consume();

        if (scanner.isIn(valueType)) {
            const value = scanner.value()!;

            scanner.consume();

            return Result.success({ ...previous, [info.key]: Number.parseFloat(value) });
        }
        else {
            return IssueType(scanner).EXPECTED(...([...valueType].map(JsonDefTypes.names).flat()));
        }
    }

    return null;
};

const parseSize = (scanner: TokenScanner): Result<SizedAttributes, Token> => {
    let result = parseBound(scanner, exactMap, numberSet);

    if (result === null)
        result = parseBounds(scanner, numberSet);

    return result === null ? Result.success({}) : result;
};


const parseBounds = (scanner: TokenScanner, type: Set<number>): Result<BoundedAttributes, Token> => {
    let previous: BoundedAttributes = {};

    let result = parseBound(scanner, boundsMap, type, previous);

    if (result !== null) {
        if (!result.success) return result;

        previous = result.value;

        if (scanner.is(JsonDefTypes.Comma)) {
            scanner.consume();

            let result = parseBound(scanner, boundsMap, type, previous);

            if (result === null)
                return IssueType(scanner).EXPECTED('bound');
            else if (!result.success)
                return result;
            else
                previous = { ...previous, ...result.value };
        }
    }

    return Result.success(previous);
};