import { tokenizeJsonDef } from '@/parser/tokenizeJsonDef';
import { JsonDefType } from '@/parser/JsonDefType';

describe('tokenizeJsonDef', () => {
    const tokenize = (input: string) => Array.from(tokenizeJsonDef(input));

    describe('Basic Keywords', () => {
        it('should tokenize simple tokens', () => {
            const input = '| = ( ) [ ] { } , < < > > <= >= : ?: ...\0';
            const expected = [
                { id: JsonDefType.Or, value: '|' },
                { id: JsonDefType.Exactly, value: '=' },
                { id: JsonDefType.Open, value: '(' },
                { id: JsonDefType.Close, value: ')' },
                { id: JsonDefType.ArrayOpen, value: '[' },
                { id: JsonDefType.ArrayClose, value: ']' },
                { id: JsonDefType.ObjectOpen, value: '{' },
                { id: JsonDefType.ObjectClose, value: '}' },
                { id: JsonDefType.Comma, value: ',' },
                { id: JsonDefType.LessThan, value: '<' },
                { id: JsonDefType.GenericOpen, value: '<' },
                { id: JsonDefType.GreaterThan, value: '>' },
                { id: JsonDefType.GenericClose, value: '>' },
                { id: JsonDefType.LessThanOrEqual, value: '<=' },
                { id: JsonDefType.GreaterThanOrEqual, value: '>=' },
                { id: JsonDefType.RequiredIs, value: ':' },
                { id: JsonDefType.OptionalIs, value: '?:' },
                { id: JsonDefType.Rest, value: '...' },
                { id: JsonDefType.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);

            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });
    });

    describe('Keywords', () => {
        it('should tokenize keywords correctly', () => {
            const input = 'null any boolean this root integer number record model group select of string datetime date time uuid base64 email true false';
            const expected = [
                { id: JsonDefType.NullKeyword, value: 'null' },
                { id: JsonDefType.AnyKeyword, value: 'any' },
                { id: JsonDefType.BooleanKeyword, value: 'boolean' },
                { id: JsonDefType.ThisKeyword, value: 'this' },
                { id: JsonDefType.RootKeyword, value: 'root' },
                { id: JsonDefType.IntegerKeyword, value: 'integer' },
                { id: JsonDefType.NumberKeyword, value: 'number' },
                { id: JsonDefType.RecordKeyword, value: 'record' },
                { id: JsonDefType.ModelKeyword, value: 'model' },
                { id: JsonDefType.GroupKeyword, value: 'group' },
                { id: JsonDefType.SelectKeyword, value: 'select' },
                { id: JsonDefType.OfKeyword, value: 'of' },
                { id: JsonDefType.StringKeyword, value: 'string' },
                { id: JsonDefType.DatetimeKeyword, value: 'datetime' },
                { id: JsonDefType.DateKeyword, value: 'date' },
                { id: JsonDefType.TimeKeyword, value: 'time' },
                { id: JsonDefType.UuidKeyword, value: 'uuid' },
                { id: JsonDefType.Base64Keyword, value: 'base64' },
                { id: JsonDefType.EmailKeyword, value: 'email' },
                { id: JsonDefType.TrueKeyword, value: 'true' },
                { id: JsonDefType.FalseKeyword, value: 'false' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });
    });

    describe('Identifiers', () => {
        it('should tokenize valid identifiers', () => {
            const input = 'myVar _private camelCase snake_case';
            const expected = [
                { id: JsonDefType.Identifier, value: 'myVar' },
                { id: JsonDefType.Identifier, value: '_private' },
                { id: JsonDefType.Identifier, value: 'camelCase' },
                { id: JsonDefType.Identifier, value: 'snake_case' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });
    });

    describe('Numbers', () => {
        it('should tokenize integers', () => {
            const input = '0 42 -17';
            const expected = [
                { id: JsonDefType.Number, value: '0' },
                { id: JsonDefType.Number, value: '42' },
                { id: JsonDefType.Integer, value: '-17' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });

        it('should tokenize real numbers', () => {
            const input = '3.14 -0.5 2.0e10 1.5E-5';
            const expected = [
                { id: JsonDefType.Real, value: '3.14' },
                { id: JsonDefType.Real, value: '-0.5' },
                { id: JsonDefType.Real, value: '2.0e10' },
                { id: JsonDefType.Real, value: '1.5E-5' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });

        it('should handle invalid real numbers', () => {
            const input = '3. 1e 2.5e';
            const expected = [
                { id: JsonDefType.InvalidReal, value: '3.' },
                { id: JsonDefType.InvalidReal, value: '1e' },
                { id: JsonDefType.InvalidReal, value: '2.5e' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });
    });

    describe('Strings', () => {
        it('should tokenize valid strings', () => {
            const input = "'hello' 'world' 'escape \\' quote' 'new\\nline'";
            const expected = [
                { id: JsonDefType.String, value: "'hello'" },
                { id: JsonDefType.String, value: "'world'" },
                { id: JsonDefType.String, value: "'escape \\' quote'" },
                { id: JsonDefType.String, value: "'new\\nline'" },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });

        it('should handle invalid escape', () => {
            const input = "'Ab\\$Cd'";
            const expected = [
                { id: JsonDefType.InvalidString, value: "'Ab\\" },
                { id: JsonDefType.Invalid, value: "$" },
                { id: JsonDefType.Identifier, value: "Cd" },
                { id: JsonDefType.InvalidString, value: "'" },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });

        it('should handle unclosed eof strings', () => {
            const input = "'unclosed string ";
            const expected = [
                { id: JsonDefType.InvalidString, value: "'unclosed string " },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });

        it('should handle unclosed eol strings', () => {
            const input = "'unclosed string \n'";
            const expected = [
                { id: JsonDefType.InvalidString, value: "'unclosed string " },
                { id: JsonDefType.InvalidString, value: "'" },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });
    });

    describe('Regex', () => {
        it('should tokenize valid regex', () => {
            const input = '/abc/ /[a-z]+/i /\\d{3}-\\d{2}-\\d{4}/';
            const expected = [
                { id: JsonDefType.Regex, value: '/abc/' },
                { id: JsonDefType.Regex, value: '/[a-z]+/i' },
                { id: JsonDefType.Regex, value: '/\\d{3}-\\d{2}-\\d{4}/' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });

        it('should handle unclosed eof regex', () => {
            const input = "/abc";
            const expected = [
                { id: JsonDefType.InvalidRegex, value: "/abc" },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });

        it('should handle unclosed eol regex', () => {
            const input = "/abc \n/";
            const expected = [
                { id: JsonDefType.InvalidRegex, value: "/abc " },
                { id: JsonDefType.InvalidRegex, value: "/" },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });
    });

    describe('Whitespace Handling', () => {
        it('should ignore whitespace between tokens', () => {
            const input = "  number  \t  42  \n  'string'  ";
            const expected = [
                { id: JsonDefType.NumberKeyword, value: 'number' },
                { id: JsonDefType.Number, value: '42' },
                { id: JsonDefType.String, value: "'string'" },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });
    });

    describe('Complex tokenizing', () => {
        it('should tokenize a complex tokenize input correctly', () => {
            const input = `
        model User {
          id: integer(> -1),
          name?: string,
          email: /^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/,
          age: number(>= 18),
          roles: string[],
          otherFields: [null, any, ...boolean[= 5]],
        }
      `;
            const expected = [
                { id: JsonDefType.ModelKeyword, value: 'model' },
                { id: JsonDefType.Identifier, value: 'User' },
                { id: JsonDefType.ObjectOpen, value: '{' },
                { id: JsonDefType.Identifier, value: 'id' },
                { id: JsonDefType.RequiredIs, value: ':' },
                { id: JsonDefType.IntegerKeyword, value: 'integer' },
                { id: JsonDefType.Open, value: '(' },
                { id: JsonDefType.GreaterThan, value: '>' },
                { id: JsonDefType.Integer, value: '-1' },
                { id: JsonDefType.Close, value: ')' },
                { id: JsonDefType.Comma, value: ',' },
                { id: JsonDefType.Identifier, value: 'name' },
                { id: JsonDefType.OptionalIs, value: '?:' },
                { id: JsonDefType.StringKeyword, value: 'string' },
                { id: JsonDefType.Comma, value: ',' },
                { id: JsonDefType.EmailKeyword, value: 'email' },
                { id: JsonDefType.RequiredIs, value: ':' },
                { id: JsonDefType.Regex, value: '/^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/' },
                { id: JsonDefType.Comma, value: ',' },
                { id: JsonDefType.Identifier, value: 'age' },
                { id: JsonDefType.RequiredIs, value: ':' },
                { id: JsonDefType.NumberKeyword, value: 'number' },
                { id: JsonDefType.Open, value: '(' },
                { id: JsonDefType.GreaterThanOrEqual, value: '>=' },
                { id: JsonDefType.Number, value: '18' },
                { id: JsonDefType.Close, value: ')' },
                { id: JsonDefType.Comma, value: ',' },
                { id: JsonDefType.Identifier, value: 'roles' },
                { id: JsonDefType.RequiredIs, value: ':' },
                { id: JsonDefType.StringKeyword, value: 'string' },
                { id: JsonDefType.ArrayOpen, value: '[' },
                { id: JsonDefType.ArrayClose, value: ']' },
                { id: JsonDefType.Comma, value: ',' },
                { id: JsonDefType.Identifier, value: 'otherFields' },
                { id: JsonDefType.RequiredIs, value: ':' },
                { id: JsonDefType.ArrayOpen, value: '[' },
                { id: JsonDefType.NullKeyword, value: 'null' },
                { id: JsonDefType.Comma, value: ',' },
                { id: JsonDefType.AnyKeyword, value: 'any' },
                { id: JsonDefType.Comma, value: ',' },
                { id: JsonDefType.Rest, value: '...' },
                { id: JsonDefType.BooleanKeyword, value: 'boolean' },
                { id: JsonDefType.ArrayOpen, value: '[' },
                { id: JsonDefType.Exactly, value: '=' },
                { id: JsonDefType.Number, value: '5' },
                { id: JsonDefType.ArrayClose, value: ']' },
                { id: JsonDefType.ArrayClose, value: ']' },
                { id: JsonDefType.Comma, value: ',' },
                { id: JsonDefType.ObjectClose, value: '}' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.type, value: t.value }))).toEqual(expected);
        });
    });
});