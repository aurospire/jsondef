import { ArrayScanner, makeScanner, Token } from "../util";
import { ArraySchema, BoundedAttributes, Schema, SizedAttributes } from '../Schema';
import { JsonDefTypes } from "./JsonDefTypes";

export type Issue = { token: Token, message: string; };

export type Result<T> = ResultSuccess<T> | ResultFailure;
export type ResultSuccess<T> = { success: true, value: T; };

export type ResultFailure = { success: false, issues: Issue[]; };

const Result = {
    success: <T>(value: T): ResultSuccess<T> => ({ success: true, value }),
    failure: (issues: Issue[]): ResultFailure => ({ success: false, issues }),
    issue: (scanner: TokenScanner, message: string) => Result.failure([{ token: scanner.peek()!, message }])
};

type TokenScanner = ArrayScanner<Token>;


// grammar JsonDef = SchemaUnion Eof;
export const parseJsonDef = (data: Token[]): Result<Schema> => {
    const scanner = makeScanner(data);

    const result = parseSchemaUnion(scanner);

    if (!result.success)
        return result;

    if (!scanner.check('id', JsonDefTypes.Eof))
        return Result.issue(scanner, 'Missing end of file');

    return result;
};

// rule SchemaUnion = [Or] Schema { Or Schema };
const parseSchemaUnion = (scanner: TokenScanner): Result<Schema> => {
    const schemas: Schema[] = [];

    if (scanner.check('id', JsonDefTypes.Or))
        scanner.consume();

    while (true) {
        const result = parseSchema(scanner);

        if (result.success)
            schemas.push(result.value);
        else
            return result;

        if (scanner.check('id', JsonDefTypes.Or))
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

// rule Schema = SchemaItem [ArrayOpen [Size] ArrayClose];
const parseSchema = (scanner: TokenScanner): Result<Schema> => {
    const result = parseSchemaItem(scanner);

    if (result.success) {
        if (scanner.check('id', JsonDefTypes.ArrayOpen)) {
            scanner.consume();

            let size: SizedAttributes;

            if (scanner.check('id', JsonDefTypes.ArrayClose)) {
                scanner.consume();
                size = {};
            }
            else {
                const sizeResult = parseSize(scanner);

                if (sizeResult.success) {
                    if (scanner.check('id', JsonDefTypes.ArrayClose)) {
                        scanner.consume();
                        size = sizeResult.value;
                    }
                    else
                        return Result.issue(scanner, 'Missing close parenthesis');
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
    switch (scanner.get('id')) {
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
            const value = scanner.get('value')!;
            scanner.consume();
            return Result.success({ kind: 'literal', of: Number.parseFloat(value) });
        }
        case JsonDefTypes.String: {
            const value = scanner.get('value')!;
            scanner.consume();
            return Result.success({ kind: 'literal', of: JSON.parse(`"${value.slice(1, -1)}"`) }); // HACK: Convert in lexe );
        }
        case JsonDefTypes.Identifier: {
            const value = scanner.get('value')!;
            scanner.consume();
            return Result.success({ kind: 'ref', of: value });
        }

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
            if (scanner.check('id', JsonDefTypes.Close)) {
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

const parseTupleSchema = (scanner: TokenScanner): Result<Schema> => { return Result.failure([]); };
const parseRecordSchema = (scanner: TokenScanner): Result<Schema> => { return Result.failure([]); };
const parseObjectSchema = (scanner: TokenScanner): Result<Schema> => { return Result.failure([]); };
const parseModelSchema = (scanner: TokenScanner): Result<Schema> => { return Result.failure([]); };
const parseSelectSchema = (scanner: TokenScanner): Result<Schema> => { return Result.failure([]); };
const parseGroupSchema = (scanner: TokenScanner): Result<Schema> => { return Result.failure([]); };
const parseIntegerSchema = (scanner: TokenScanner): Result<Schema> => { return Result.failure([]); };
const parseNumberSchema = (scanner: TokenScanner): Result<Schema> => { return Result.failure([]); };
const parseStringSchema = (scanner: TokenScanner): Result<Schema> => { return Result.failure([]); };



const parseBound = (scanner: TokenScanner,
    map: Map<number, { key: keyof SizedAttributes, other?: keyof SizedAttributes; }>,
    valueType: number,
    previous: SizedAttributes = {}
): Result<Partial<Record<keyof SizedAttributes, number>>> | null => {
    let info = map.get(scanner.get('id')!);

    if (info) {
        if (info.key in previous)
            return Result.issue(scanner, `${info.key} already defined`);
        if (info.other && info.other in previous)
            return Result.issue(scanner, `${info.other} already defined`);

        scanner.consume();

        if (scanner.check('id', valueType)) {
            const value = scanner.get('value')!;

            scanner.consume();

            return Result.success({ ...previous, [info.key]: Number.parseInt(value) });
        }
        else {
            return Result.issue(scanner, `Missing ${info} size number`);
        }
    }

    return null;
};

const exactMap = new Map<number, { key: keyof SizedAttributes; }>([[JsonDefTypes.Exactly, { key: 'exact' }]]);
const boundsMap = new Map<number, { key: keyof SizedAttributes, other: keyof SizedAttributes; }>([
    [JsonDefTypes.LessThan, { key: 'xmin', other: 'min' }],
    [JsonDefTypes.LessThanOrEqual, { key: 'min', other: 'xmin' }],
    [JsonDefTypes.GreaterThan, { key: 'xmax', other: 'max' }],
    [JsonDefTypes.GreaterThanOrEqual, { key: 'max', other: 'xmax' }],
]);


const parseSize = (scanner: TokenScanner): Result<SizedAttributes> => {
    let result = parseBound(scanner, exactMap, JsonDefTypes.Number);

    if (result === null)
        result = parseBounds(scanner, JsonDefTypes.Number);

    return result === null ? Result.success({}) : result;
};


const parseBounds = (scanner: TokenScanner, type: number): Result<BoundedAttributes> => {
    let previous: BoundedAttributes = {};

    while (true) {
        const result = parseBound(scanner, boundsMap, type, previous);

        if (result === null)
            break;
        else if (!result.success)
            return result;

        previous = result.value;

        if (scanner.check('id', JsonDefTypes.Comma))
            scanner.consume();
        else
            break;
    }

    return Result.success(previous);
};