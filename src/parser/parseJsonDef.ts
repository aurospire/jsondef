import {
    ArraySchema, BoundedAttributes, GroupSchema, IntegerSchema,
    ModelSchema, NumberSchema, ObjectSchema, RecordSchema,
    Schema, SchemaObject, SizedAttributes, StringFormat,
    StringSchema, TupleSchema
} from '../Schema';
import { RegexString, Token, TokenScanner } from "../util";
import { Issue, Result, ResultFailure } from '../util/Result';
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
    EXPECTED: (expected: string): ResultFailure<Token> => issue(scanner, `Expected ${expected}`),
    EXPECTED_SYMBOL: (expected: string): ResultFailure<Token> => issue(scanner, `Expected '${expected}'`),
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

        if (scanner.is(JsonDefTypes.Or))
            scanner.consume();
        else
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
        if (scanner.is(JsonDefTypes.ArrayOpen)) {
            scanner.consume();

            let size: SizedAttributes;

            if (scanner.is(JsonDefTypes.ArrayClose)) {
                scanner.consume();
                size = {};
            }
            else {
                const sizeResult = parseSize(scanner);

                if (sizeResult.success) {
                    if (scanner.is(JsonDefTypes.ArrayClose)) {
                        scanner.consume();
                        size = sizeResult.value;
                    }
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

const parseSchemaItem = (scanner: TokenScanner): Result<Schema, Token> => {
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
            if (scanner.is(JsonDefTypes.Close)) {
                scanner.consume();
                return result;
            }
            else {
                return IssueType(scanner).EXPECTED_SYMBOL(')');
            }
        }
    }

    return IssueType(scanner).EXPECTED('Schema');
};


const numberSet = new Set<number>([JsonDefTypes.Number]);

const integerSet = new Set<number>([JsonDefTypes.Number, JsonDefTypes.Integer]);

const realSet = new Set<number>([JsonDefTypes.Number, JsonDefTypes.Integer, JsonDefTypes.Real]);


const parseIntegerSchema = (scanner: TokenScanner): Result<IntegerSchema, Token> => {
    scanner.consume();

    let bounds: BoundedAttributes = {};

    if (scanner.is(JsonDefTypes.Open)) {
        scanner.consume();

        const boundsResult = parseBounds(scanner, integerSet);

        if (boundsResult.success) {
            bounds = boundsResult.value;

            if (scanner.is(JsonDefTypes.Close))
                scanner.consume();
            else
                return IssueType(scanner).EXPECTED_SYMBOL(')');
        }
        else
            return boundsResult;
    }

    return Result.success({ kind: 'integer', ...bounds });
};

const parseNumberSchema = (scanner: TokenScanner): Result<NumberSchema, Token> => {
    scanner.consume();

    let bounds: BoundedAttributes = {};

    if (scanner.is(JsonDefTypes.Open)) {
        scanner.consume();

        const boundsResult = parseBounds(scanner, realSet);

        if (boundsResult.success) {
            bounds = boundsResult.value;

            if (scanner.is(JsonDefTypes.Close))
                scanner.consume();
            else
                return IssueType(scanner).EXPECTED_SYMBOL(')');
        }
        else
            return boundsResult;
    }

    return Result.success({ kind: 'number', ...bounds });
};

const parseStringSchema = (scanner: TokenScanner): Result<StringSchema, Token> => {
    const value = scanner.value()!;

    const of = value === 'string' ? {} : { of: value as StringFormat | RegexString };

    scanner.consume();

    let size: SizedAttributes = {};

    if (scanner.is(JsonDefTypes.Open)) {
        scanner.consume();

        const sizeResult = parseSize(scanner);

        if (sizeResult.success) {
            size = sizeResult.value;

            if (scanner.is(JsonDefTypes.Close))
                scanner.consume();
            else
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
        if (scanner.is(JsonDefTypes.Rest)) {

            scanner.consume();

            const restResult = parseSchema(scanner);

            if (restResult.success) {
                if (restResult.value.kind !== 'array')
                    return IssueType(scanner).MUST_BE('Rest Schema', 'an Array Schema');

                rest = restResult.value;

                if (scanner.is(JsonDefTypes.Comma))
                    scanner.consume();

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

            if (schemaResult.success) {
                schemas.push(schemaResult.value);
            }

            if (scanner.is(JsonDefTypes.Comma))
                scanner.consume();
        }
    }

    if (!scanner.is(JsonDefTypes.ArrayClose))
        return IssueType(scanner).EXPECTED_SYMBOL(']');

    scanner.consume();

    return Result.success({ kind: 'tuple', of: schemas, ...(rest ? { rest: rest as ArraySchema } : {}) });
};

const parseRecordSchema = (scanner: TokenScanner): Result<RecordSchema, Token> => {
    scanner.consume();

    if (!scanner.is(JsonDefTypes.GenericOpen))
        return IssueType(scanner).EXPECTED_SYMBOL('<');

    scanner.consume();

    const first = parseSchemaUnion(scanner);
    let last: Result<Schema, Token> | undefined;
    let size: SizedAttributes = {};

    if (!first.success)
        return first;

    if (scanner.is(JsonDefTypes.Comma)) {
        if (first.value.kind !== 'string')
            return IssueType(scanner).MUST_BE('Record Key', 'String Schema');

        scanner.consume();

        last = parseSchemaUnion(scanner);

        if (!last.success)
            return last;
    }

    if (scanner.is(JsonDefTypes.GenericClose))
        scanner.consume();
    else
        return IssueType(scanner).EXPECTED_SYMBOL('>');


    if (scanner.is(JsonDefTypes.Open)) {
        scanner.consume();

        const sizeResult = parseSize(scanner);

        if (!sizeResult.success)
            return sizeResult;

        size = sizeResult.value;

        if (scanner.is(JsonDefTypes.Close))
            scanner.consume();
        else
            return IssueType(scanner).EXPECTED_SYMBOL(')');

    }


    return Result.success(last && last.success
        ? { kind: 'record', of: last.value, key: first.value as StringSchema, ...size }
        : { kind: 'record', of: first.value, ...size });
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
        return IssueType(scanner).EXPECTED(optional ? `':' or '?:'` : `':`);
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

const parseSelectSchema = (scanner: TokenScanner): Result<GroupSchema, Token> => {
    // Consume SelectKeyword
    scanner.consume();

    let selected: string;

    if (scanner.is(JsonDefTypes.Identifier)) {
        selected = scanner.value()!;
        scanner.consume();
    }
    else if (scanner.is(JsonDefTypes.String)) {
        selected = scanner.value()!.slice(1, -1);
        scanner.consume();
    }
    else
        return IssueType(scanner).EXPECTED('Selected name');

    if (!scanner.consumeIf(JsonDefTypes.OfKeyword))
        return IssueType(scanner).EXPECTED_SYMBOL('of');

    if (!scanner.consumeIf(JsonDefTypes.GroupKeyword))
        return IssueType(scanner).EXPECTED_SYMBOL('group');

    const result = parseStruct(scanner, false);

    if (result.success) {
        if ((selected in result.value))
            return Result.success({ kind: 'group', of: result.value, selected });
        else
            return IssueType(scanner).SELECTED_NOT_FOUND(selected);
    }
    else {
        return result;
    }
};

const parseGroupSchema = (scanner: TokenScanner): Result<GroupSchema, Token> => {
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
): Result<Partial<Record<keyof SizedAttributes, number>>, Token> | null => {
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
            return IssueType(scanner).EXPECTED([...valueType].map(JsonDefTypes.names).flat().join(' or '));
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