import { tokenizeJsonDef } from '@/parser/tokenizeJsonDef';
import { JsonDefTypes } from '@/parser/JsonDefTypes';

describe('tokenizeJsonDef', () => {
    const tokenize = (input: string) => Array.from(tokenizeJsonDef(input));

    describe('Basic Tokens', () => {
        it('should tokenize simple tokens', () => {
            const input = '| = ( ) [ ] { } , < < > > <= >= : ?: ...';
            const expected = [
                { id: JsonDefTypes.Or, value: '|' },
                { id: JsonDefTypes.Exactly, value: '=' },
                { id: JsonDefTypes.Open, value: '(' },
                { id: JsonDefTypes.Close, value: ')' },
                { id: JsonDefTypes.ArrayOpen, value: '[' },
                { id: JsonDefTypes.ArrayClose, value: ']' },
                { id: JsonDefTypes.ObjectOpen, value: '{' },
                { id: JsonDefTypes.ObjectClose, value: '}' },
                { id: JsonDefTypes.Comma, value: ',' },
                { id: JsonDefTypes.LessThan, value: '<' },
                { id: JsonDefTypes.GenericOpen, value: '<' },
                { id: JsonDefTypes.GreaterThan, value: '>' },
                { id: JsonDefTypes.GenericClose, value: '>' },
                { id: JsonDefTypes.LessThanOrEqual, value: '<=' },
                { id: JsonDefTypes.GreaterThanOrEqual, value: '>=' },
                { id: JsonDefTypes.RequiredIs, value: ':' },
                { id: JsonDefTypes.OptionalIs, value: '?:' },
                { id: JsonDefTypes.Rest, value: '...' },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });
    });

    describe('Keywords', () => {
        it('should tokenize keywords correctly', () => {
            const input = 'null any boolean this root integer number record model group select of string datetime date time uuid base64 email true false';
            const expected = [
                { id: JsonDefTypes.NullToken, value: 'null' },
                { id: JsonDefTypes.AnyToken, value: 'any' },
                { id: JsonDefTypes.BooleanToken, value: 'boolean' },
                { id: JsonDefTypes.ThisToken, value: 'this' },
                { id: JsonDefTypes.RootToken, value: 'root' },
                { id: JsonDefTypes.IntegerToken, value: 'integer' },
                { id: JsonDefTypes.NumberToken, value: 'number' },
                { id: JsonDefTypes.RecordToken, value: 'record' },
                { id: JsonDefTypes.ModelToken, value: 'model' },
                { id: JsonDefTypes.GroupToken, value: 'group' },
                { id: JsonDefTypes.SelectToken, value: 'select' },
                { id: JsonDefTypes.OfToken, value: 'of' },
                { id: JsonDefTypes.StringToken, value: 'string' },
                { id: JsonDefTypes.DatetimeToken, value: 'datetime' },
                { id: JsonDefTypes.DateToken, value: 'date' },
                { id: JsonDefTypes.TimeToken, value: 'time' },
                { id: JsonDefTypes.UuidToken, value: 'uuid' },
                { id: JsonDefTypes.Base64Token, value: 'base64' },
                { id: JsonDefTypes.EmailToken, value: 'email' },
                { id: JsonDefTypes.TrueToken, value: 'true' },
                { id: JsonDefTypes.FalseToken, value: 'false' },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });
    });

    describe('Identifiers', () => {
        it('should tokenize valid identifiers', () => {
            const input = 'myVar _private camelCase snake_case';
            const expected = [
                { id: JsonDefTypes.Identifier, value: 'myVar' },
                { id: JsonDefTypes.Identifier, value: '_private' },
                { id: JsonDefTypes.Identifier, value: 'camelCase' },
                { id: JsonDefTypes.Identifier, value: 'snake_case' },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });
    });

    describe('Numbers', () => {
        it('should tokenize integers', () => {
            const input = '0 42 -17';
            const expected = [
                { id: JsonDefTypes.Number, value: '0' },
                { id: JsonDefTypes.Number, value: '42' },
                { id: JsonDefTypes.Integer, value: '-17' },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });

        it('should tokenize real numbers', () => {
            const input = '3.14 -0.5 2.0e10 1.5E-5';
            const expected = [
                { id: JsonDefTypes.Real, value: '3.14' },
                { id: JsonDefTypes.Real, value: '-0.5' },
                { id: JsonDefTypes.Real, value: '2.0e10' },
                { id: JsonDefTypes.Real, value: '1.5E-5' },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });

        it('should handle invalid real numbers', () => {
            const input = '3. 1e 2.5e';
            const expected = [
                { id: JsonDefTypes.InvalidReal, value: '3.' },
                { id: JsonDefTypes.InvalidReal, value: '1e' },
                { id: JsonDefTypes.InvalidReal, value: '2.5e' },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });
    });

    describe('Strings', () => {
        it('should tokenize valid strings', () => {
            const input = "'hello' 'world' 'escape \\' quote' 'new\\nline'";
            const expected = [
                { id: JsonDefTypes.String, value: "'hello'" },
                { id: JsonDefTypes.String, value: "'world'" },
                { id: JsonDefTypes.String, value: "'escape \\' quote'" },
                { id: JsonDefTypes.String, value: "'new\\nline'" },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });

        it('should handle invalid escape', () => {
            const input = "'Ab\\$Cd'";
            const expected = [
                { id: JsonDefTypes.InvalidString, value: "'Ab\\" },
                { id: JsonDefTypes.Invalid, value: "$" },
                { id: JsonDefTypes.Identifier, value: "Cd" },
                { id: JsonDefTypes.InvalidString, value: "'" },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });

        it('should handle unclosed eof strings', () => {
            const input = "'unclosed string ";
            const expected = [
                { id: JsonDefTypes.InvalidString, value: "'unclosed string " },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });

        it('should handle unclosed eol strings', () => {
            const input = "'unclosed string \n'";
            const expected = [
                { id: JsonDefTypes.InvalidString, value: "'unclosed string " },
                { id: JsonDefTypes.InvalidString, value: "'" },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });
    });

    describe('Regex', () => {
        it('should tokenize valid regex', () => {
            const input = '/abc/ /[a-z]+/i /\\d{3}-\\d{2}-\\d{4}/';
            const expected = [
                { id: JsonDefTypes.Regex, value: '/abc/' },
                { id: JsonDefTypes.Regex, value: '/[a-z]+/i' },
                { id: JsonDefTypes.Regex, value: '/\\d{3}-\\d{2}-\\d{4}/' },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });

        it('should handle unclosed eof regex', () => {
            const input = "/abc";
            const expected = [
                { id: JsonDefTypes.InvalidRegex, value: "/abc" },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });

        it('should handle unclosed eol regex', () => {
            const input = "/abc \n/";
            const expected = [
                { id: JsonDefTypes.InvalidRegex, value: "/abc " },
                { id: JsonDefTypes.InvalidRegex, value: "/" },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });
    });

    describe('Whitespace Handling', () => {
        it('should ignore whitespace between tokens', () => {
            const input = "  number  \t  42  \n  'string'  ";
            const expected = [
                { id: JsonDefTypes.NumberToken, value: 'number' },
                { id: JsonDefTypes.Number, value: '42' },
                { id: JsonDefTypes.String, value: "'string'" },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
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
                { id: JsonDefTypes.ModelToken, value: 'model' },
                { id: JsonDefTypes.Identifier, value: 'User' },
                { id: JsonDefTypes.ObjectOpen, value: '{' },
                { id: JsonDefTypes.Identifier, value: 'id' },
                { id: JsonDefTypes.RequiredIs, value: ':' },
                { id: JsonDefTypes.IntegerToken, value: 'integer' },
                { id: JsonDefTypes.Open, value: '(' },
                { id: JsonDefTypes.GreaterThan, value: '>' },
                { id: JsonDefTypes.Integer, value: '-1' },
                { id: JsonDefTypes.Close, value: ')' },
                { id: JsonDefTypes.Comma, value: ',' },
                { id: JsonDefTypes.Identifier, value: 'name' },
                { id: JsonDefTypes.OptionalIs, value: '?:' },
                { id: JsonDefTypes.StringToken, value: 'string' },
                { id: JsonDefTypes.Comma, value: ',' },
                { id: JsonDefTypes.EmailToken, value: 'email' },
                { id: JsonDefTypes.RequiredIs, value: ':' },
                { id: JsonDefTypes.Regex, value: '/^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/' },
                { id: JsonDefTypes.Comma, value: ',' },
                { id: JsonDefTypes.Identifier, value: 'age' },
                { id: JsonDefTypes.RequiredIs, value: ':' },
                { id: JsonDefTypes.NumberToken, value: 'number' },
                { id: JsonDefTypes.Open, value: '(' },
                { id: JsonDefTypes.GreaterThanOrEqual, value: '>=' },
                { id: JsonDefTypes.Number, value: '18' },
                { id: JsonDefTypes.Close, value: ')' },
                { id: JsonDefTypes.Comma, value: ',' },
                { id: JsonDefTypes.Identifier, value: 'roles' },
                { id: JsonDefTypes.RequiredIs, value: ':' },
                { id: JsonDefTypes.StringToken, value: 'string' },
                { id: JsonDefTypes.ArrayOpen, value: '[' },
                { id: JsonDefTypes.ArrayClose, value: ']' },
                { id: JsonDefTypes.Comma, value: ',' },
                { id: JsonDefTypes.Identifier, value: 'otherFields' },
                { id: JsonDefTypes.RequiredIs, value: ':' },
                { id: JsonDefTypes.ArrayOpen, value: '[' },
                { id: JsonDefTypes.NullToken, value: 'null' },
                { id: JsonDefTypes.Comma, value: ',' },
                { id: JsonDefTypes.AnyToken, value: 'any' },
                { id: JsonDefTypes.Comma, value: ',' },
                { id: JsonDefTypes.Rest, value: '...' },
                { id: JsonDefTypes.BooleanToken, value: 'boolean' },
                { id: JsonDefTypes.ArrayOpen, value: '[' },
                { id: JsonDefTypes.Exactly, value: '=' },
                { id: JsonDefTypes.Number, value: '5' },
                { id: JsonDefTypes.ArrayClose, value: ']' },
                { id: JsonDefTypes.ArrayClose, value: ']' },
                { id: JsonDefTypes.Comma, value: ',' },
                { id: JsonDefTypes.ObjectClose, value: '}' },
                { id: JsonDefTypes.Eof, value: '\0' },
            ];
            const tokens = tokenize(input);
            expect(tokens.map(t => ({ id: t.id, value: t.value }))).toEqual(expected);
        });
    });
});