import {
    ArraySchema, BoundedAttributes, GroupSchema, IntegerSchema,
    ModelSchema, NumberSchema, ObjectSchema, RecordSchema,
    Schema, SchemaObject, SizedAttributes, StringFormat,
    StringSchema, TupleSchema
} from '../Schema';
import { RegexString, Token, TokenScanner } from "../util";
import { Issue, Result } from '../util/Result';
import { JsonDefTypes } from "./JsonDefTypes";


const issue = (scanner: TokenScanner, message: string, issues?: Issue<Token>[]) =>
    Result.failure([...(issues ?? []), { on: scanner.peek()!, message }]);

export const parseJsonDef = (data: Token[]): Result<Schema, Token> => {
    const scanner = new TokenScanner(data);

    const result = parseSchemaUnion(scanner);

    if (!result.success)
        return result;

    if (!scanner.is(JsonDefTypes.Eof))
        return issue(scanner, 'Missing end of file');

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
        return issue(scanner, 'Schema not found');
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
                        return issue(scanner, 'Missing array close');
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
                return issue(scanner, 'Missing closing parenthesis');
            }
        }
    }

    return issue(scanner, 'Schema not found');
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
                return issue(scanner, 'Missing bounds close');
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
                return issue(scanner, 'Missing bounds close');
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
                return issue(scanner, 'Missing bounds close');
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
                    return issue(scanner, 'Rest Schema must be an array');

                rest = restResult.value;

                if (scanner.is(JsonDefTypes.Comma))
                    scanner.consume();

                break;
            }
            else {
                return issue(scanner, 'Missing rest schema', restResult.issues);
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
        return issue(scanner, 'Missing tuple end');

    scanner.consume();

    return Result.success({ kind: 'tuple', of: schemas, ...(rest ? { rest: rest as ArraySchema } : {}) });
};

const parseRecordSchema = (scanner: TokenScanner): Result<RecordSchema, Token> => {
    scanner.consume();

    if (!scanner.is(JsonDefTypes.GenericOpen))
        return issue(scanner, `Expecting '<'`);

    scanner.consume();

    const first = parseSchemaUnion(scanner);
    let last: Result<Schema, Token> | undefined;
    let size: SizedAttributes = {};

    if (!first.success)
        return first;

    if (scanner.is(JsonDefTypes.Comma)) {
        if (first.value.kind !== 'string')
            return issue(scanner, 'Record key must be a string schema');

        scanner.consume();

        last = parseSchemaUnion(scanner);

        if (!last.success)
            return last;
    }

    if (scanner.is(JsonDefTypes.GenericClose))
        scanner.consume();
    else
        return issue(scanner, `Expecting '>'`);


    if (scanner.is(JsonDefTypes.Open)) {
        scanner.consume();

        const sizeResult = parseSize(scanner);

        if (!sizeResult.success)
            return sizeResult;

        size = sizeResult.value;

        if (scanner.is(JsonDefTypes.Close))
            scanner.consume();
        else
            return issue(scanner, `Expecting ')'`);

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
            return issue(scanner, 'Optional definitions not allowed');

        isOptional = { isOptional: true };

        scanner.consume();
    }
    else {
        return issue(scanner, `Expected ${optional ? `':' or '?:'` : `':`}`);
    }

    const schema = parseSchemaUnion(scanner);

    if (schema.success)
        return Result.success({ key, schema: { ...schema.value, ...isOptional } });
    else
        return schema;
};

const parseStruct = (scanner: TokenScanner, optional: boolean): Result<SchemaObject, Token> => {
    if (!scanner.consumeIf(JsonDefTypes.ObjectOpen))
        return issue(scanner, `Expected '{'`);

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
        return issue(scanner, `Expected '}'`);

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
        return issue(scanner, 'Missing selected name');

    if (!scanner.consumeIf(JsonDefTypes.OfKeyword))
        return issue(scanner, `Expected 'of'`);

    if (!scanner.consumeIf(JsonDefTypes.GroupKeyword))
        return issue(scanner, `Expected 'group'`);

    const result = parseStruct(scanner, false);

    if (result.success) {
        if ((selected in result.value))
            return Result.success({ kind: 'group', of: result.value, selected });
        else
            return issue(scanner, `Group member '${selected}' does not exist`);
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
            return issue(scanner, `${info.key} already defined`);
        if (info.other && info.other in previous)
            return issue(scanner, `${info.other} already defined`);

        scanner.consume();

        if (scanner.isIn(valueType)) {
            const value = scanner.value()!;

            scanner.consume();

            return Result.success({ ...previous, [info.key]: Number.parseFloat(value) });
        }
        else {
            return issue(scanner, `Missing ${info} size number`);
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
                return issue(scanner, 'Missing Bound');
            else if (!result.success)
                return result;
            else
                previous = { ...previous, ...result.value };
        }
    }

    return Result.success(previous);
};