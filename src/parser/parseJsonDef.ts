import {
    ArraySchema, BoundedAttributes, GroupSchema, IntegerSchema,
    ModelSchema, NumberSchema, ObjectSchema, RecordSchema,
    Schema, SchemaObject, SizedAttributes, StringFormat,
    StringSchema, TupleSchema
} from '../Schema';
import { RegexString, Token, TokenScanner } from "../util";
import { Result, ResultFailure, ResultSuccess } from '../util/Result';
import { JsonDefType } from "./JsonDefType";

const issue = (scanner: TokenScanner | undefined, message: string) =>
    Result.failure<Token>([{
        on: scanner?.peek() ?? {
            type: -1,
            mark: scanner?.peek(-1)?.mark ?? { position: 0, line: 0, column: 0 },
            length: 0,
            value: ''
        },
        message
    }]);

export const IssueType = (scanner: TokenScanner | undefined) => ({
    UNEXPECTED_EOF: (): ResultFailure<Token> => issue(scanner, 'Unexpected end of input'),
    EXPECTED_EOF: (): ResultFailure<Token> => issue(scanner, 'Expected end of input'),
    EXPECTED: (...expected: (string | undefined)[]): ResultFailure<Token> => issue(scanner, `Expected ${expected.filter(Boolean).join(' or ')}`),
    EXPECTED_SYMBOL: (...expected: (string | undefined)[]): ResultFailure<Token> => issue(scanner, `Expected ${expected.filter(Boolean).map(i => `'${i}'`).join(' or ')}`),
    MUST_BE: (name: string, type: string): ResultFailure<Token> => issue(scanner, `${name} must be ${type}`),
    SELECTED_NOT_FOUND: (name: string): ResultFailure<Token> => issue(scanner, `Selected '${name}' is not in a schema in group`),
    DUPLICATE_IDENTIFIER: (name: string): ResultFailure<Token> => issue(scanner, `Duplicate identifier: ${name}`),
    BOUND_ALREADY_DEFINED: (bound: string) => issue(scanner, `Bound ${bound} already defined`),
} as const);

export const parseJsonDef = (data: Token[]): Result<Schema, Token> => {
    const scanner = new TokenScanner(data);

    const result = parseSchemaUnion(scanner);

    if (!result.success) return result;

    if (!scanner.isEnd && !scanner.is(JsonDefType.Eof)) return IssueType(scanner).EXPECTED_EOF();

    return result;
};

const parseSchemaUnion = (scanner: TokenScanner): Result<Schema, Token> => {
    const schemas: Schema[] = [];

    scanner.consumeIf(JsonDefType.Or);

    while (true) {
        const result = parseSchema(scanner);

        if (result.success)
            schemas.push(result.value);
        else
            return result;

        if (!scanner.consumeIf(JsonDefType.Or))
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
    let result = parseSchemaItem(scanner);

    if (result.success) {
        while (scanner.consumeIf(JsonDefType.ArrayOpen)) {
            let size: SizedAttributes;

            if (scanner.consumeIf(JsonDefType.ArrayClose)) {
                size = {};
            }
            else {
                const sizeResult = parseSize(scanner);

                if (sizeResult.success) {
                    if (scanner.consumeIf(JsonDefType.ArrayClose))
                        size = sizeResult.value;
                    else
                        return IssueType(scanner).EXPECTED_SYMBOL(']');
                }
                else {
                    return sizeResult;
                }
            }

            result = Result.success({ kind: 'array', of: result.value, ...size });
        }
    }

    return result;
};

// HACK: convert escapes, TODO: add field to Token to translate when created
const parseString = (value: string) => JSON.parse(`"${value.slice(1, -1).replaceAll('\\x', '\\u00').replaceAll('\\\'', '\'').replaceAll('\\0', '\\u0000')}"`);

const simpleSchema = (scanner: TokenScanner, kind: Schema['kind'], of?: any): ResultSuccess<Schema> => {
    scanner.consume(); return Result.success({ kind, ...(of !== undefined ? { of } : {}) });
};

const parseSchemaItem = (scanner: TokenScanner): Result<Schema, Token> => {
    switch (scanner.type()) {
        case JsonDefType.NullKeyword:
        case JsonDefType.AnyKeyword:
        case JsonDefType.BooleanKeyword:
        case JsonDefType.ThisKeyword:
        case JsonDefType.RootKeyword:
            return simpleSchema(scanner, scanner.value()! as Schema['kind']);
        case JsonDefType.TrueKeyword:
            return simpleSchema(scanner, 'literal', true);
        case JsonDefType.FalseKeyword:
            return simpleSchema(scanner, 'literal', false);
        case JsonDefType.Number:
        case JsonDefType.Integer:
        case JsonDefType.Real:
            return simpleSchema(scanner, 'literal', Number.parseFloat(scanner.value()!));
        case JsonDefType.String:
            return simpleSchema(scanner, 'literal', parseString(scanner.value()!));
        case JsonDefType.Identifier:
            return simpleSchema(scanner, 'ref', scanner.value()!);
        case JsonDefType.DateKeyword:
        case JsonDefType.TimeKeyword:
        case JsonDefType.DatetimeKeyword:
        case JsonDefType.UuidKeyword:
        case JsonDefType.Base64Keyword:
        case JsonDefType.EmailKeyword:
        case JsonDefType.Regex:
        case JsonDefType.StringKeyword:
            return parseStringSchema(scanner);
        case JsonDefType.IntegerKeyword:
        case JsonDefType.NumberKeyword:
            return parseNumericSchema(scanner);
        case JsonDefType.ArrayOpen:
            return parseTupleSchema(scanner);
        case JsonDefType.RecordKeyword:
            return parseRecordSchema(scanner);
        case JsonDefType.ObjectOpen:
            return parseObjectSchema(scanner);
        case JsonDefType.ModelKeyword:
            return parseModelSchema(scanner);
        case JsonDefType.GroupKeyword:
            return parseGroupSchema(scanner);
        case JsonDefType.SelectKeyword:
            return parseSelectSchema(scanner);
        case JsonDefType.Open: {
            scanner.consume();
            const result = parseSchemaUnion(scanner);
            if (!result.success) return result;
            return scanner.consumeIf(JsonDefType.Close) ? result : IssueType(scanner).EXPECTED_SYMBOL(')');
        }
    }

    return IssueType(scanner).EXPECTED('Schema');
};


/* BOUNDS */
const numberSet = new Set<number>([JsonDefType.Number]);

const integerSet = new Set<number>([JsonDefType.Number, JsonDefType.Integer]);

const realSet = new Set<number>([JsonDefType.Number, JsonDefType.Integer, JsonDefType.Real]);


type BoundsMap = Map<number, { key: keyof SizedAttributes, other?: keyof SizedAttributes; }>;

const exactMap: BoundsMap = new Map([[JsonDefType.Exactly, { key: 'exact' }]]);

const boundsMap: BoundsMap = new Map([
    [JsonDefType.GreaterThan, { key: 'xmin', other: 'min' }],
    [JsonDefType.GreaterThanOrEqual, { key: 'min', other: 'xmin' }],
    [JsonDefType.LessThan, { key: 'xmax', other: 'max' }],
    [JsonDefType.LessThanOrEqual, { key: 'max', other: 'xmax' }],
]);

const parseEnclosedBounds = <A extends BoundedAttributes>(scanner: TokenScanner, parser: (scanner: TokenScanner) => Result<A, Token>)
    : Result<A, Token> => {
    let attributes: A = {} as A;

    if (scanner.consumeIf(JsonDefType.Open)) {
        const result = parser(scanner);

        if (result.success) {
            attributes = result.value;

            if (!scanner.consumeIf(JsonDefType.Close))
                return IssueType(scanner).EXPECTED_SYMBOL(')');
        }
        else
            return result;
    }

    return Result.success(attributes);
};

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
            return IssueType(scanner).EXPECTED(...([...valueType].map(id => JsonDefType.names(id)).flat()));
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

        if (scanner.is(JsonDefType.Comma)) {
            scanner.consume();

            let result = parseBound(scanner, boundsMap, type, previous);

            if (result === null) { }
            else if (!result.success)
                return result;
            else
                previous = { ...previous, ...result.value };
        }
    }

    return Result.success(previous);
};

const integerBoundsParser = (scanner: TokenScanner) => parseBounds(scanner, integerSet);

const realBoundsParser = (scanner: TokenScanner) => parseBounds(scanner, realSet);


/* SCHEMAS */
const parseNumericSchema = (scanner: TokenScanner): Result<IntegerSchema | NumberSchema, Token> => {
    const kind = scanner.value()! as 'number' | 'integer';

    scanner.consume();

    let boundsResult = parseEnclosedBounds(scanner, kind === 'integer' ? integerBoundsParser : realBoundsParser);

    return boundsResult.success ? Result.success({ kind, ...boundsResult.value }) : boundsResult;
};


const parseStringSchema = (scanner: TokenScanner): Result<StringSchema, Token> => {
    const value = scanner.value()!;

    const of = value === 'string' ? {} : { of: value as StringFormat | RegexString };

    scanner.consume();

    const sizeResult = parseEnclosedBounds(scanner, parseSize);

    return sizeResult.success ? Result.success({ kind: 'string', ...sizeResult.value, ...of }) : sizeResult;
};

const parseTupleSchema = (scanner: TokenScanner): Result<TupleSchema | ArraySchema, Token> => {
    scanner.consume();

    let schemas: Schema[] = [];
    let rest: Schema | undefined;

    while (!scanner.consumeIf(JsonDefType.ArrayClose)) {
        if (schemas.length)
            if (!scanner.consumeIf(JsonDefType.Comma))
                return (IssueType(scanner).EXPECTED_SYMBOL(','));

        if (scanner.consumeIf(JsonDefType.Rest)) {
            const restResult = parseSchema(scanner);

            if (restResult.success) {
                if (restResult.value.kind !== 'array')
                    return IssueType(scanner).MUST_BE('Rest Schema', 'an Array Schema');

                rest = restResult.value;

                scanner.consumeIf(JsonDefType.Comma);

                if (!scanner.consumeIf(JsonDefType.ArrayClose))
                    return IssueType(scanner).EXPECTED_SYMBOL(']');

                break;
            }
            else {
                return IssueType(scanner).EXPECTED('Rest Schema'); // TODO: Multiple Issues
            }
        }
        else {
            const schemaResult = parseSchema(scanner);

            if (schemaResult.success)
                schemas.push(schemaResult.value);
            else
                return schemaResult;
        }
    }

    return schemas.length || !rest
        ? Result.success({ kind: 'tuple', of: schemas, ...(rest ? { rest: rest as ArraySchema } : {}) })
        : Result.success(rest as ArraySchema);
};

const parseRecordSchema = (scanner: TokenScanner): Result<RecordSchema, Token> => {
    scanner.consume();

    if (!scanner.consumeIf(JsonDefType.GenericOpen))
        return IssueType(scanner).EXPECTED_SYMBOL('<');

    const keyOrValue = parseSchemaUnion(scanner);
    let value: Result<Schema, Token> | undefined;

    if (!keyOrValue.success)
        return keyOrValue;

    if (scanner.consumeIf(JsonDefType.Comma)) {
        if (keyOrValue.value.kind !== 'string')
            return IssueType(scanner).MUST_BE('Record Key', 'String Schema');

        value = parseSchemaUnion(scanner);

        if (!value.success)
            return value;
    }

    if (!scanner.consumeIf(JsonDefType.GenericClose))
        return IssueType(scanner).EXPECTED_SYMBOL('>');

    const sizeResult = parseEnclosedBounds(scanner, parseSize);

    return !sizeResult.success
        ? sizeResult
        : Result.success(value && value.success
            ? { kind: 'record', of: value.value, key: keyOrValue.value as StringSchema, ...sizeResult.value }
            : { kind: 'record', of: keyOrValue.value, ...sizeResult.value });
};


const parseStructItem = (scanner: TokenScanner, previous: SchemaObject, optional: boolean): Result<SchemaObject, Token> | null => {
    let key: string;

    if (scanner.is(JsonDefType.Identifier))
        key = scanner.value()!;
    else if (scanner.is(JsonDefType.String))
        key = scanner.value()!.slice(1, -1);
    else
        return null;

    if (previous[key])
        return IssueType(scanner).DUPLICATE_IDENTIFIER(key);
    else
        scanner.consume();

    let isOptional = {};

    if (scanner.is(JsonDefType.RequiredIs)) {
        scanner.consume();
    }
    else if (scanner.is(JsonDefType.OptionalIs)) {
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
        return Result.success({ ...previous, [key]: { ...schema.value, ...isOptional } });
    else
        return schema;
};

const parseStruct = (scanner: TokenScanner, optional: boolean): Result<SchemaObject, Token> => {
    if (!scanner.consumeIf(JsonDefType.ObjectOpen))
        return IssueType(scanner).EXPECTED_SYMBOL('{');


    let result: SchemaObject = {};

    while (true) {
        const itemResult = parseStructItem(scanner, result, optional);

        if (itemResult === null)
            break;
        else if (!itemResult.success)
            return itemResult;

        result = itemResult.value;

        if (!scanner.consumeIf(JsonDefType.Comma))
            break;
    }

    if (!scanner.consumeIf(JsonDefType.ObjectClose))
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
    if (scanner.consumeIf(JsonDefType.String))
        selected = selected.slice(1, -1);
    else if (!scanner.consumeIf(JsonDefType.Identifier))
        return IssueType(scanner).EXPECTED('Selected name');

    if (!scanner.consumeIf(JsonDefType.OfKeyword))
        return IssueType(scanner).EXPECTED_SYMBOL('of');

    if (!scanner.consumeIf(JsonDefType.GroupKeyword))
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
