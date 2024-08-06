import { ArrayScanner, makeScanner, Token } from "../util";
import { Schema } from '..';
import { JsonDefTypes } from "./JsonDefTypes";

export type Issue = { token: Token, message: string; };

export type Result = { success: true, schema: Schema; } | { success: false, issues: Issue[]; };

const Result = {
    success: (schema: Schema): Result => ({ success: true, schema }),
    failure: (issues: Issue[]): Result => ({ success: false, issues })
};

type TokenScanner = ArrayScanner<Token>;


// grammar JsonDef = SchemaUnion Eof;
export const parseJsonDef = (data: Token[]): Result => {
    const scanner = makeScanner(data);

    let result: Result;

    if (!(result = parseSchemaUnion(scanner)).success)
        return result;

    if (!scanner.check('id', JsonDefTypes.Eof))
        return Result.failure([{ token: scanner.peek()!, message: 'Missing End of File' }]);

    return result;
};

// rule SchemaUnion = [Or] Schema { Or Schema };
export const parseSchemaUnion = (scanner: TokenScanner): Result => {
    const schemas: Schema[] = [];

    if (scanner.check('id', JsonDefTypes.Or))
        scanner.consume();

    while (true) {
        const result = parseSchema(scanner);

        if (result === null)
            break;
        else if (result.success)
            schemas.push(result.schema);
        else
            return result;

        if (scanner.check('id', JsonDefTypes.Or))
            scanner.consume();
        else
            break;
    }

    if (schemas.length === 0)
        return Result.failure([{ token: scanner.peek()!, message: 'Schema not Found' }]);
    else if (schemas.length === 1)
        return Result.success(schemas[0]);
    else
        return Result.success({ kind: 'union', of: schemas });
};

// rule Schema = SchemaItem [ArrayOpen [Size] ArrayClose];
export const parseSchema = (scanner: TokenScanner): Result | null => {
    const result = parseSchemaItem(scanner);

    if (result === null) {
        return null;
    }
    else if (result.success) {
        if (scanner.check('id', JsonDefTypes.ArrayOpen)) {
            return result;
        }
        else {
            return result;
        }
    }
    else {
        return result;
    }
};

export const parseSchemaItem = (scanner: TokenScanner): Result | null => {
    switch (scanner.get('id')) {
        case JsonDefTypes.NullToken: {
            scanner.consume();
            return Result.success({ kind: 'null' });
        }
        case JsonDefTypes.AnyToken: {
            scanner.consume();
            return Result.success({ kind: 'any' });
        }
        case JsonDefTypes.BooleanToken: {
            scanner.consume();
            return Result.success({ kind: 'boolean' });
        }
        case JsonDefTypes.ThisToken: {
            scanner.consume();
            return Result.success({ kind: 'this' });
        }
        case JsonDefTypes.RootToken: {
            scanner.consume();
            return Result.success({ kind: 'root' });
        }
        case JsonDefTypes.TrueToken: {
            scanner.consume();
            return Result.success({ kind: 'literal', of: true });
        }
        case JsonDefTypes.FalseToken: {
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
        case JsonDefTypes.Open: {
            scanner.consume();
            const result = parseSchemaUnion(scanner);
            if (!result.success) return result;
            if (scanner.check('id', JsonDefTypes.Close)) {
                scanner.consume();
                return result;
            }
            else {
                return Result.failure([{ token: scanner.peek()!, message: 'Missing Closing Parentheses' }]);
            }
        }
    }

    return null;
};
