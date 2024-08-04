import { Schema, NullSchema, AnySchema, BooleanSchema, IntegerSchema, NumberSchema, LiteralSchema, StringSchema, ArraySchema, TupleSchema, RecordSchema, ObjectSchema, ModelSchema, GroupSchema, UnionSchema, ThisSchema, RootSchema, RefSchema } from '@/Schema';
import { makeContext } from '@/validate/Context';
import { validateSchema } from '@/validate/validateSchema';
import { inspect } from 'util';

const validate = (schema: Schema, expected: boolean, values: any[]) => {
    values.forEach(value => {
        const result = validateSchema(value, schema, [], makeContext()) === true;
        expect(result).toBe(expected);
    });
};

const validateShow = (schema: Schema, expected: boolean, values: any[]) => {
    values.forEach(value => {
        const result = validateSchema(value, schema, [], makeContext());
        console.log(inspect({ value, result, expected }, { depth: null, colors: true }));
        expect(result === true).toBe(expected);
    });
};


describe('Schema Validation', () => {

    describe('NullSchema Validation', () => {
        const nullSchema: NullSchema = { kind: 'null' };

        it('should pass for null values', () => {
            validate(nullSchema, true, [null]);
        });

        it('should fail for non-null values', () => {
            validate(nullSchema, false, [undefined, 0, '', false, {}, []]);
        });
    });

    describe('AnySchema Validation', () => {
        const anySchema: AnySchema = { kind: 'any' };

        it('should pass for valid types', () => {
            validate(anySchema, true, [null, 0, '', false, {}, []]);
        });

        it('should pass for complex nested structures', () => {
            const complexObject = {
                a: 1,
                b: 'string',
                c: [1, 2, 3],
                d: { e: true, f: null },
            };

            validate(anySchema, true, [complexObject]);
        });

        it('should fail for invalid types', () => {
            validate(anySchema, false, [
                undefined, NaN, Infinity, -Infinity, new Date(), new Map<string, number>, {
                    a: {
                        b: [new Date(), { c: Infinity, d: -Infinity }],
                        c: new Set<Date>
                    }
                }
            ]);
        });
    });

    describe('BooleanSchema Validation', () => {
        const booleanSchema: BooleanSchema = { kind: 'boolean' };
        it('should pass for boolean values', () => {
            validate(booleanSchema, true, [true, false]);
        });

        it('should fail for non-boolean values', () => {
            validate(booleanSchema, false, [null, undefined, 0, 1, '', 'string', {}, []]);
        });
    });

    describe('IntegerSchema Validation', () => {
        it('should pass for valid integers', () => {
            const integerSchema: IntegerSchema = { kind: 'integer' };
            validate(integerSchema, true, [0, 1, -1, 1000000, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
        });

        it('should fail for non-integer numbers', () => {
            const integerSchema: IntegerSchema = { kind: 'integer' };
            validate(integerSchema, false, [0.1, 1.1, -1.1, Math.PI, Number.MAX_VALUE, Number.MIN_VALUE]);
        });

        it('should fail for non-number values', () => {
            const integerSchema: IntegerSchema = { kind: 'integer' };
            validate(integerSchema, false, [null, undefined, '', 'string', true, false, {}, []]);
        });

        it('should enforce minimum bound', () => {
            const integerSchema: IntegerSchema = { kind: 'integer', min: 0 };
            validate(integerSchema, true, [0, 1, 1000]);
            validate(integerSchema, false, [-1, -1000]);
        });

        it('should enforce exclusive minimum bound', () => {
            const integerSchema: IntegerSchema = { kind: 'integer', xmin: 0 };
            validate(integerSchema, true, [1, 1000]);
            validate(integerSchema, false, [0, -1, -1000]);
        });

        it('should enforce maximum bound', () => {
            const integerSchema: IntegerSchema = { kind: 'integer', max: 100 };
            validate(integerSchema, true, [0, 1, 100]);
            validate(integerSchema, false, [101, 1000]);
        });

        it('should enforce exclusive maximum bound', () => {
            const integerSchema: IntegerSchema = { kind: 'integer', xmax: 100 };
            validate(integerSchema, true, [0, 1, 99]);
            validate(integerSchema, false, [100, 101, 1000]);
        });

        it('should enforce minimum and maximum bounds', () => {
            const integerSchema: IntegerSchema = { kind: 'integer', min: 0, max: 100 };
            validate(integerSchema, true, [0, 1, 50, 100]);
            validate(integerSchema, false, [-1, 101]);
        });

        it('should enforce minimum and exclusive maximum bounds', () => {
            const integerSchema: IntegerSchema = { kind: 'integer', min: 0, xmax: 100 };
            validate(integerSchema, true, [0, 1, 50, 99]);
            validate(integerSchema, false, [-1, 100, 101]);
        });

        it('should enforce exclusive minimum and maximum bounds', () => {
            const integerSchema: IntegerSchema = { kind: 'integer', xmin: 0, max: 100 };
            validate(integerSchema, true, [1, 50, 100]);
            validate(integerSchema, false, [0, -1, 101]);
        });

        it('should enforce exclusive minimum and maximum bounds', () => {
            const integerSchema: IntegerSchema = { kind: 'integer', xmin: 0, xmax: 100 };
            validate(integerSchema, true, [1, 50, 99]);
            validate(integerSchema, false, [0, 100, -1, 101]);
        });
    });

    describe('NumberSchema Validation', () => {
        it('should pass for valid numbers', () => {
            const numberSchema: NumberSchema = { kind: 'number' };
            validate(numberSchema, true, [0, 1, -1, 0.1, -0.1, Math.PI, Number.MAX_VALUE, Number.MIN_VALUE]);
        });

        it('should fail for non-number values', () => {
            const numberSchema: NumberSchema = { kind: 'number' };
            validate(numberSchema, false, [null, undefined, '', 'string', true, false, {}, [], NaN, Infinity, -Infinity]);
        });

        it('should enforce minimum bound', () => {
            const numberSchema: NumberSchema = { kind: 'number', min: 0 };
            validate(numberSchema, true, [0, 0.1, 1, 1000]);
            validate(numberSchema, false, [-0.1, -1, -1000]);
        });

        it('should enforce exclusive minimum bound', () => {
            const numberSchema: NumberSchema = { kind: 'number', xmin: 0 };
            validate(numberSchema, true, [0.1, 1, 1000]);
            validate(numberSchema, false, [0, -0.1, -1, -1000]);
        });

        it('should enforce maximum bound', () => {
            const numberSchema: NumberSchema = { kind: 'number', max: 100 };
            validate(numberSchema, true, [0, 0.1, 1, 100]);
            validate(numberSchema, false, [100.1, 101, 1000]);
        });

        it('should enforce exclusive maximum bound', () => {
            const numberSchema: NumberSchema = { kind: 'number', xmax: 100 };
            validate(numberSchema, true, [0, 0.1, 1, 99.9]);
            validate(numberSchema, false, [100, 100.1, 101, 1000]);
        });

        it('should enforce minimum and maximum bounds', () => {
            const numberSchema: NumberSchema = { kind: 'number', min: 0, max: 100 };
            validate(numberSchema, true, [0, 0.1, 1, 50, 99.9, 100]);
            validate(numberSchema, false, [-0.1, -1, 100.1, 101]);
        });

        it('should enforce exclusive minimum and maximum bounds', () => {
            const numberSchema: NumberSchema = { kind: 'number', xmin: 0, xmax: 100 };
            validate(numberSchema, true, [0.1, 1, 50, 99.9]);
            validate(numberSchema, false, [0, 100, -0.1, 100.1]);
        });

        it('should enforce minimum and exclusive maximum bounds', () => {
            const numberSchema: NumberSchema = { kind: 'number', min: 0, xmax: 100 };
            validate(numberSchema, true, [0, 0.1, 1, 50, 99.9]);
            validate(numberSchema, false, [-0.1, 100, 100.1]);
        });

        it('should enforce exclusive minimum and maximum bounds', () => {
            const numberSchema: NumberSchema = { kind: 'number', xmin: 0, max: 100 };
            validate(numberSchema, true, [0.1, 1, 50, 99.9, 100]);
            validate(numberSchema, false, [0, -0.1, 100.1]);
        });
    });

    describe('LiteralSchema Validation', () => {
        describe('Boolean Literal', () => {
            const booleanLiteralSchema: LiteralSchema = { kind: 'literal', of: true };

            it('should pass for matching boolean literal', () => {
                validate(booleanLiteralSchema, true, [true]);
            });

            it('should fail for non-matching boolean values', () => {
                validate(booleanLiteralSchema, false, [false]);
            });

            it('should fail for non-boolean values', () => {
                validate(booleanLiteralSchema, false, [0, 1, 'true', null, undefined, {}, []]);
            });
        });

        describe('Number Literal', () => {
            const numberLiteralSchema: LiteralSchema = { kind: 'literal', of: 42 };

            it('should pass for matching number literal', () => {
                validate(numberLiteralSchema, true, [42]);
            });

            it('should fail for non-matching number values', () => {
                validate(numberLiteralSchema, false, [0, 41, 43, -42, 42.1]);
            });

            it('should fail for non-number values', () => {
                validate(numberLiteralSchema, false, ['42', true, false, null, undefined, {}, []]);
            });
        });

        describe('String Literal', () => {
            const stringLiteralSchema: LiteralSchema = { kind: 'literal', of: 'hello' };

            it('should pass for matching string literal', () => {
                validate(stringLiteralSchema, true, ['hello']);
            });

            it('should fail for non-matching string values', () => {
                validate(stringLiteralSchema, false, ['', 'Hello', 'hello ', ' hello', 'world']);
            });

            it('should fail for non-string values', () => {
                validate(stringLiteralSchema, false, [0, true, false, null, undefined, {}, []]);
            });
        });

        describe('Empty String Literal', () => {
            const emptyStringLiteralSchema: LiteralSchema = { kind: 'literal', of: '' };

            it('should pass for empty string literal', () => {
                validate(emptyStringLiteralSchema, true, ['']);
            });

            it('should fail for non-empty strings', () => {
                validate(emptyStringLiteralSchema, false, [' ', 'a', 'hello']);
            });

            it('should fail for non-string values', () => {
                validate(emptyStringLiteralSchema, false, [0, true, false, null, undefined, {}, []]);
            });
        });
    });

    describe('StringSchema Validation', () => {

        describe('Basic String Validation', () => {
            const schema: StringSchema = { kind: 'string' };

            it('should pass for valid strings', () => {
                validate(schema, true, ['', 'hello', '123', 'special!@#']);
            });

            it('should fail for non-string values', () => {
                validate(schema, false, [123, true, null, undefined, [], {}]);
            });
        });

        describe('String Length Validation', () => {
            it('should validate minimum length', () => {
                const schema: StringSchema = { kind: 'string', min: 3 };
                validate(schema, true, ['abc', 'abcd', 'long string']);
                validate(schema, false, ['', 'a', 'ab']);
            });

            it('should validate maximum length', () => {
                const schema: StringSchema = { kind: 'string', max: 5 };
                validate(schema, true, ['', 'a', 'ab', 'abc', 'abcd', 'abcde']);
                validate(schema, false, ['abcdef', 'long string']);
            });

            it('should validate exclusive minimum length', () => {
                const schema: StringSchema = { kind: 'string', xmin: 3 };
                validate(schema, true, ['abcd', 'long string']);
                validate(schema, false, ['', 'a', 'ab', 'abc']);
            });

            it('should validate exclusive maximum length', () => {
                const schema: StringSchema = { kind: 'string', xmax: 5 };
                validate(schema, true, ['', 'a', 'ab', 'abc', 'abcd']);
                validate(schema, false, ['abcde', 'abcdef', 'long string']);
            });

            it('should validate minimum and maximum length', () => {
                const schema: StringSchema = { kind: 'string', min: 2, max: 4 };
                validate(schema, true, ['ab', 'abc', 'abcd']);
                validate(schema, false, ['a', 'abcde', 'long string']);
            });

            it('should validate minimum and exclusive maximum length', () => {
                const schema: StringSchema = { kind: 'string', min: 2, xmax: 4 };
                validate(schema, true, ['ab', 'abc']);
                validate(schema, false, ['a', 'abcd', 'abcde', 'long string']);
            });

            it('should validate exclusive minimum and maximum length', () => {
                const schema: StringSchema = { kind: 'string', xmin: 2, max: 4 };
                validate(schema, true, ['abc', 'abcd']);
                validate(schema, false, ['a', 'ab', 'abcde', 'long string']);
            });

            it('should validate exclusive minimum and exclusive maximum length', () => {
                const schema: StringSchema = { kind: 'string', xmin: 2, xmax: 4 };
                validate(schema, true, ['abc']);
                validate(schema, false, ['a', 'ab', 'abcd', 'abcde', 'long string']);
            });
        });

        describe('String Pattern Validation', () => {
            it('should validate date pattern', () => {
                const schema: StringSchema = { kind: 'string', of: 'date' };
                validate(schema, true, ['1900-01-01', '2099-12-31', '2023-02-28', '2024-02-29']);
                validate(schema, false, ['2023-13-01', '2023-05-32', '2023-02-29', '20230515', '2023/05/15']);
            });

            it('should validate time pattern', () => {
                const schema: StringSchema = { kind: 'string', of: 'time' };
                validate(schema, true, ['12:30:45', '00:00:00', '23:59:59', '12:30:45.123']);
                validate(schema, false, ['24:00:00', '12:60:00', '12:30:60', '12:30', '12:30:45.1234']);
            });

            it('should validate datetime pattern', () => {
                const schema: StringSchema = { kind: 'string', of: 'datetime' };
                validate(schema, true, [
                    '2023-05-15T12:30:45Z',
                    '2023-05-15T12:30:45+01:00',
                    '2023-05-15T12:30:45-01:00',
                    '2023-05-15T12:30:45+23:59',
                    '2023-05-15T12:30:45-23:59',
                    '2023-05-15T12:30:45-2359',
                    '2023-05-15T12:30:45-23',
                    '2023-05-15T12:30:45.123Z'
                ]);
                validate(schema, false, [
                    '2023-05-15 12:30:45',
                    '2023-05-15T25:30:45Z',
                    '2023-05-15T12:30:45+24:00'
                ]);
            });

            it('should validate uuid pattern', () => {
                const schema: StringSchema = { kind: 'string', of: 'uuid' };
                validate(schema, true, [
                    '123e4567-e89b-12d3-a456-426614174000',
                    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
                ]);
                validate(schema, false, [
                    '123e4567-e89b-12d3-a456-42661417400',
                    '123e4567-e89b-12d3-a456-4266141740001',
                    '123e4567-e89b-12d3-a456-42661417400g'
                ]);
            });

            it('should validate email pattern', () => {
                const schema: StringSchema = { kind: 'string', of: 'email' };
                validate(schema, true, [
                    'test@example.com',
                    'user.name+tag@example.co.uk',
                    '1234567890@example.com'
                ]);
                validate(schema, false, [
                    'plainaddress',
                    '@example.com',
                    'email@example',
                    'email@example..com'
                ]);
            });

            it('should validate base64 pattern', () => {
                const schema: StringSchema = { kind: 'string', of: 'base64' };
                validate(schema, true, [
                    'SGVsbG8gV29ybGQ=',
                    'dGVzdA==',
                    'bG9uZ2VyIHN0cmluZyB0byBlbmNvZGU='
                ]);
                validate(schema, false, [
                    'Invalid base64!',
                    'SGVsbG8gV29ybGQ',
                    'SGVsbG8gV29ybGQ===',
                    'a'
                ]);
            });

            it('should validate custom regex string pattern', () => {
                const schema: StringSchema = { kind: 'string', of: '/^[A-Z]{3}-\\d{3}$/' };
                validate(schema, true, ['ABC-123', 'XYZ-789']);
                validate(schema, false, ['abc-123', 'ABC-1234', 'ABCD-123']);
            });

            it('should validate custom regex pattern', () => {
                const schema: StringSchema = { kind: 'string', of: /^[A-Z]{3}-\d{3}$/ };
                validate(schema, true, ['ABC-123', 'XYZ-789']);
                validate(schema, false, ['abc-123', 'ABC-1234', 'ABCD-123']);
            });
        });
    });

    describe('ArraySchema Validation', () => {

        describe('Basic Array Validation', () => {
            const schema: ArraySchema = { kind: 'array', of: { kind: 'any' } };

            it('should pass for valid arrays', () => {
                validate(schema, true, [
                    [],
                    [1, 2, 3],
                    ['a', 'b', 'c'],
                    [true, false],
                    [null, [], {}],
                    [[1, 2], [3, 4]]
                ]);
            });

            it('should fail for non-array values', () => {
                validate(schema, false, [
                    null,
                    undefined,
                    42,
                    'string',
                    true,
                    {},
                    new Date(),
                    /regex/,
                    new Set(),
                    new Map()
                ]);
            });
        });

        describe('Array with Specific Item Type', () => {
            const schema: ArraySchema = { kind: 'array', of: { kind: 'number' } };

            it('should pass for arrays with correct item types', () => {
                validate(schema, true, [
                    [],
                    [1],
                    [1, 2, 3],
                    [0, -1, 3.14]
                ]);
            });

            it('should fail for arrays with incorrect item types', () => {
                validate(schema, false, [
                    ['string'],
                    [1, 'two', 3],
                    [true, false],
                    [null],
                    [{}],
                    [[]]
                ]);
            });
        });

        describe('Array Length Constraints', () => {
            it('should validate arrays with minimum length', () => {
                const schema: ArraySchema = { kind: 'array', of: { kind: 'any' }, min: 2 };
                validate(schema, true, [[1, 2], [1, 2, 3], [1, 2, 3, 4]]);
                validate(schema, false, [[], [1]]);
            });

            it('should validate arrays with maximum length', () => {
                const schema: ArraySchema = { kind: 'array', of: { kind: 'any' }, max: 3 };
                validate(schema, true, [[], [1], [1, 2], [1, 2, 3]]);
                validate(schema, false, [[1, 2, 3, 4], [1, 2, 3, 4, 5]]);
            });

            it('should validate arrays with exclusive minimum length', () => {
                const schema: ArraySchema = { kind: 'array', of: { kind: 'any' }, xmin: 2 };
                validate(schema, true, [[1, 2, 3], [1, 2, 3, 4]]);
                validate(schema, false, [[], [1], [1, 2]]);
            });

            it('should validate arrays with exclusive maximum length', () => {
                const schema: ArraySchema = { kind: 'array', of: { kind: 'any' }, xmax: 3 };
                validate(schema, true, [[], [1], [1, 2]]);
                validate(schema, false, [[1, 2, 3], [1, 2, 3, 4]]);
            });

            it('should validate arrays with minimum and maximum length', () => {
                const schema: ArraySchema = { kind: 'array', of: { kind: 'any' }, min: 2, max: 4 };
                validate(schema, true, [[1, 2], [1, 2, 3], [1, 2, 3, 4]]);
                validate(schema, false, [[], [1], [1, 2, 3, 4, 5]]);
            });

            it('should validate arrays with minimum and exclusive maximum length', () => {
                const schema: ArraySchema = { kind: 'array', of: { kind: 'any' }, min: 2, xmax: 4 };
                validate(schema, true, [[1, 2], [1, 2, 3]]);
                validate(schema, false, [[], [1], [1, 2, 3, 4], [1, 2, 3, 4, 5]]);
            });

            it('should validate arrays with exclusive minimum and maximum length', () => {
                const schema: ArraySchema = { kind: 'array', of: { kind: 'any' }, xmin: 2, max: 4 };
                validate(schema, true, [[1, 2, 3], [1, 2, 3, 4]]);
                validate(schema, false, [[], [1], [1, 2], [1, 2, 3, 4, 5]]);
            });

            it('should validate arrays with exclusive minimum and exclusive maximum length', () => {
                const schema: ArraySchema = { kind: 'array', of: { kind: 'any' }, xmin: 2, xmax: 4 };
                validate(schema, true, [[1, 2, 3]]);
                validate(schema, false, [[], [1], [1, 2], [1, 2, 3, 4], [1, 2, 3, 4, 5]]);
            });
        });

        describe('Nested Array Validation', () => {
            const schema: ArraySchema = {
                kind: 'array',
                of: {
                    kind: 'array',
                    of: { kind: 'number' }
                }
            };

            it('should pass for valid nested arrays', () => {
                validate(schema, true, [
                    [],
                    [[]],
                    [[1, 2], [3, 4]],
                    [[1], [2, 3], [4, 5, 6]]
                ]);
            });

            it('should fail for invalid nested arrays', () => {
                validate(schema, false, [
                    [1, 2, 3],
                    [[1, 2], 3],
                    [[1, 'two'], [3, 4]],
                    [[1, 2], [3, [4]]]
                ]);
            });
        });

        describe('Array with Complex Item Schema', () => {
            const schema: ArraySchema = {
                kind: 'array',
                of: {
                    kind: 'object',
                    of: {
                        id: { kind: 'number' },
                        name: { kind: 'string' },
                        active: { kind: 'boolean' }
                    }
                }
            };

            it('should pass for valid complex arrays', () => {
                validate(schema, true, [
                    [],
                    [{ id: 1, name: 'Item 1', active: true }],
                    [
                        { id: 1, name: 'Item 1', active: true },
                        { id: 2, name: 'Item 2', active: false }
                    ]
                ]);
            });

            it('should fail for invalid complex arrays', () => {
                validate(schema, false, [
                    [{ id: '1', name: 'Item 1', active: true }],
                    [{ id: 1, name: 'Item 1' }],
                    [
                        { id: 1, name: 'Item 1', active: true },
                        { id: 2, name: 'Item 2', active: 'yes' }
                    ]
                ]);
            });
        });
    });

    describe('TupleSchema Validation', () => {
        describe('Basic Tuple Validation', () => {
            const schema: TupleSchema = {
                kind: 'tuple', of: [
                    { kind: 'string' }, { kind: 'number' }, { kind: 'boolean' }
                ]
            };

            it('should pass for valid tuples', () => {
                validate(schema, true, [
                    ['hello', 42, true],
                    ['world', 0, false],
                    ['', -1, true],
                ]);
            });

            it('should fail for non-tuple values', () => {
                validate(schema, false, [
                    'not a tuple',
                    42,
                    true,
                    {},
                    null,
                    undefined,
                ]);
            });

            it('should fail for tuples with incorrect length', () => {
                validate(schema, false, [
                    ['too short', 42],
                    ['too long', 42, true, 'extra'],
                ]);
            });
        });

        describe('Tuple with Rest Schema', () => {
            const schema: TupleSchema = {
                kind: 'tuple',
                of: [{ kind: 'string' }, { kind: 'number' }],
                rest: { kind: 'array', of: { kind: 'boolean' } }
            };

            it('should pass for valid tuples with rest items', () => {
                validate(schema, true, [
                    ['hello', 42],
                    ['world', 0, true],
                    ['', -1, false, true, false],
                ]);
            });

            it('should fail for tuples with incorrect rest item types', () => {
                validate(schema, false, [
                    ['hello', 42, 'not a boolean'],
                    ['world', 0, true, 42],
                ]);
            });
        });

        describe('Tuple with Bounded Rest Schema', () => {
            const boundedRestSchema: TupleSchema = {
                kind: 'tuple',
                of: [{ kind: 'string' }],
                rest: { kind: 'array', of: { kind: 'number' }, min: 1, max: 3 }
            };

            it('should pass for valid bounded rest items', () => {
                validate(boundedRestSchema, true, [
                    ['hello', 1],
                    ['world', 1, 2],
                    ['test', 1, 2, 3],
                ]);
            });

            it('should fail for invalid bounded rest items', () => {
                validate(boundedRestSchema, false, [
                    ['hello'],
                    ['world', 1, 2, 3, 4],
                ]);
            });
        });
    });

    describe('RecordSchema Validation', () => {
        describe('Basic Record Validation', () => {
            const schema: RecordSchema = { kind: 'record', of: { kind: 'string' } };

            it('should pass for valid records with string values', () => {
                validate(schema, true, [
                    { a: 'foo', b: 'bar' },
                    { x: 'test' },
                    {}
                ]);
            });

            it('should fail for non-object values', () => {
                validate(schema, false, [
                    'string',
                    123,
                    true,
                    null,
                    undefined,
                    [],
                    () => { }
                ]);
            });

            it('should fail for records with non-string values', () => {
                validate(schema, false, [
                    { a: 123 },
                    { b: true },
                    { c: null },
                    { d: {} },
                    { e: [] }
                ]);
            });
        });

        describe('Record with Number Values', () => {
            const schema: RecordSchema = { kind: 'record', of: { kind: 'number' } };

            it('should pass for valid records with number values', () => {
                validate(schema, true, [
                    { a: 1, b: 2.5 },
                    { x: 0 },
                    {}
                ]);
            });

            it('should fail for records with non-number values', () => {
                validate(schema, false, [
                    { a: '123' },
                    { b: true },
                    { c: null },
                    { d: {} },
                    { e: [] }
                ]);
            });
        });

        describe('Record with Key Validation', () => {
            const schema: RecordSchema = {
                kind: 'record',
                of: { kind: 'string' },
                key: { kind: 'string', of: '/^[a-z]+$/' }
            };

            it('should pass for records with valid keys', () => {
                validate(schema, true, [
                    { abc: 'foo', def: 'bar' },
                    { x: 'test' },
                    {}
                ]);
            });

            it('should fail for records with invalid keys', () => {
                validate(schema, false, [
                    { A: 'foo' },
                    { '123': 'bar' },
                    { 'a-b': 'baz' },
                ]);
            });
        });

        describe('Record with Bounded Length', () => {
            it('should pass for records within min length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, min: 2 };
                validate(schema, true, [
                    { a: 'foo', b: 'bar' },
                    { x: 'test', y: 'example', z: 'extra' }
                ]);
            });

            it('should fail for records below min length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, min: 2 };
                validate(schema, false, [
                    {},
                    { a: 'single' }
                ]);
            });

            it('should pass for records within max length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, max: 2 };
                validate(schema, true, [
                    {},
                    { a: 'single' },
                    { x: 'test', y: 'example' }
                ]);
            });

            it('should fail for records above max length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, max: 2 };
                validate(schema, false, [
                    { a: 'foo', b: 'bar', c: 'baz' },
                    { w: 'one', x: 'two', y: 'three', z: 'four' }
                ]);
            });

            it('should pass for records within xmin length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, xmin: 1 };
                validate(schema, true, [
                    { a: 'foo', b: 'bar' },
                    { x: 'test', y: 'example', z: 'extra' }
                ]);
            });

            it('should fail for records at or below xmin length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, xmin: 1 };
                validate(schema, false, [
                    {},
                    { a: 'single' }
                ]);
            });

            it('should pass for records within xmax length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, xmax: 3 };
                validate(schema, true, [
                    {},
                    { a: 'single' },
                    { x: 'test', y: 'example' }
                ]);
            });

            it('should fail for records at or above xmax length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, xmax: 3 };
                validate(schema, false, [
                    { a: 'foo', b: 'bar', c: 'baz' },
                    { w: 'one', x: 'two', y: 'three', z: 'four' }
                ]);
            });

            it('should pass for records within or at min and max length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, min: 1, max: 3 };
                validate(schema, true, [
                    { a: 'single' },
                    { x: 'test', y: 'example' },
                    { i: 'one', j: 'two', k: 'three' }
                ]);
            });

            it('should fail for records outside min and max length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, min: 1, max: 3 };
                validate(schema, false, [
                    {},
                    { a: 'foo', b: 'bar', c: 'baz', d: 'qux' }
                ]);
            });

            it('should pass for records within xmin and xmax length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, xmin: 1, xmax: 3 };
                validate(schema, true, [
                    { x: 'test', y: 'example' }
                ]);
            });

            it('should fail for records at or outside xmin and xmax length', () => {
                const schema: RecordSchema = { kind: 'record', of: { kind: 'string' }, xmin: 1, xmax: 3 };
                validate(schema, false, [
                    {},
                    { a: 'foo', },
                    { a: 'foo', b: 'bar', c: 'baz' },
                    { w: 'one', x: 'two', y: 'three', z: 'four' }
                ]);
            });
        });

        describe('Nested Record Schema', () => {
            const schema: RecordSchema = {
                kind: 'record',
                of: {
                    kind: 'object',
                    of: {
                        name: { kind: 'string' },
                        age: { kind: 'number' }
                    }
                }
            };

            it('should pass for valid nested records', () => {
                validate(schema, true, [
                    {
                        person1: { name: 'Alice', age: 30 },
                        person2: { name: 'Bob', age: 25 }
                    },
                    {}
                ]);
            });

            it('should fail for invalid nested records', () => {
                validate(schema, false, [
                    {
                        person1: { name: 'Alice', age: '30' },
                        person2: { name: 'Bob' }
                    },
                    {
                        invalid: { foo: 'bar' }
                    }
                ]);
            });
        });
    });

    describe('ObjectSchema Validation', () => {
        describe('Basic Object Structure', () => {
            const schema: ObjectSchema = {
                kind: 'object',
                of: {
                    name: { kind: 'string' },
                    age: { kind: 'integer' }
                }
            };

            it('should validate correct object structure', () => {
                validate(schema, true, [{ name: 'John', age: 30 }]);
            });

            it('should invalidate incorrect object structure', () => {
                validate(schema, false, [
                    { name: 'John', age: '30' },
                    { name: 'John' },
                    { age: 30 },
                    'not an object',
                    42,
                    null,
                    undefined
                ]);
            });
        });

        describe('Optional Properties', () => {
            const schema: ObjectSchema = {
                kind: 'object',
                of: {
                    name: { kind: 'string' },
                    age: { kind: 'integer', isOptional: true }
                }
            };

            it('should allow missing optional properties', () => {
                validate(schema, true, [
                    { name: 'John', age: 30 },
                    { name: 'Jane' }
                ]);
            });

            it('should invalidate missing required properties', () => {
                validate(schema, false, [
                    { age: 25 },
                    {}
                ]);
            });
        });

        describe('Excess Properties', () => {
            const schema: ObjectSchema = {
                kind: 'object',
                of: {
                    name: { kind: 'string' },
                    age: { kind: 'integer' }
                }
            };

            it('should invalidate objects with excess properties', () => {
                validate(schema, false, [
                    { name: 'John', age: 30, occupation: 'Developer' },
                    { name: 'Jane', age: 25, hobbies: ['reading', 'swimming'] }
                ]);
            });
        });

        describe('Nested Object Structures', () => {
            const schema: ObjectSchema = {
                kind: 'object',
                of: {
                    person: {
                        kind: 'object',
                        of: {
                            name: { kind: 'string' },
                            age: { kind: 'integer' }
                        }
                    },
                    address: {
                        kind: 'object',
                        of: {
                            street: { kind: 'string' },
                            city: { kind: 'string' }
                        }
                    }
                }
            };

            it('should validate correct nested object structure', () => {
                validate(schema, true, [{
                    person: { name: 'John', age: 30 },
                    address: { street: 'Main St', city: 'New York' }
                }]);
            });

            it('should invalidate incorrect nested object structure', () => {
                validate(schema, false, [
                    {
                        person: { name: 'John', age: '30' },
                        address: { street: 'Main St', city: 'New York' }
                    },
                    {
                        person: { name: 'Jane' },
                        address: { street: 'Broadway', city: 'Chicago' }
                    },
                    {
                        person: { name: 'Bob', age: 25 },
                        address: { street: 123, city: 'Los Angeles' }
                    }
                ]);
            });
        });
    });

    describe('ModelSchema Validation', () => {
        describe('Basic Model Structure', () => {
            const schema: ModelSchema = {
                kind: 'model',
                of: {
                    name: { kind: 'string' },
                    age: { kind: 'integer' }
                }
            };

            it('should validate correct model structure', () => {
                validate(schema, true, [{ name: 'John', age: 30 }]);
            });

            it('should invalidate incorrect model structure', () => {
                validate(schema, false, [
                    { name: 'John', age: '30' },
                    { name: 'John' },
                    { age: 30 },
                    'not an model',
                    42,
                    null,
                    undefined
                ]);
            });
        });

        describe('Optional Properties', () => {
            const schema: ModelSchema = {
                kind: 'model',
                of: {
                    name: { kind: 'string' },
                    age: { kind: 'integer', isOptional: true }
                }
            };

            it('should allow missing optional properties', () => {
                validate(schema, true, [
                    { name: 'John', age: 30 },
                    { name: 'Jane' }
                ]);
            });

            it('should invalidate missing required properties', () => {
                validate(schema, false, [
                    { age: 25 },
                    {}
                ]);
            });
        });

        describe('Excess Properties', () => {
            const schema: ModelSchema = {
                kind: 'model',
                of: {
                    name: { kind: 'string' },
                    age: { kind: 'integer' }
                }
            };

            it('should invalidate models with excess properties', () => {
                validate(schema, false, [
                    { name: 'John', age: 30, occupation: 'Developer' },
                    { name: 'Jane', age: 25, hobbies: ['reading', 'swimming'] }
                ]);
            });
        });

        describe('Nested Model Structures', () => {
            const schema: ModelSchema = {
                kind: 'model',
                of: {
                    person: {
                        kind: 'model',
                        of: {
                            name: { kind: 'string' },
                            age: { kind: 'integer' }
                        }
                    },
                    address: {
                        kind: 'model',
                        of: {
                            street: { kind: 'string' },
                            city: { kind: 'string' }
                        }
                    }
                }
            };

            it('should validate correct nested model structure', () => {
                validate(schema, true, [{
                    person: { name: 'John', age: 30 },
                    address: { street: 'Main St', city: 'New York' }
                }]);
            });

            it('should invalidate incorrect nested model structure', () => {
                validate(schema, false, [
                    {
                        person: { name: 'John', age: '30' },
                        address: { street: 'Main St', city: 'New York' }
                    },
                    {
                        person: { name: 'Jane' },
                        address: { street: 'Broadway', city: 'Chicago' }
                    },
                    {
                        person: { name: 'Bob', age: 25 },
                        address: { street: 123, city: 'Los Angeles' }
                    }
                ]);
            });
        });
    });

    describe('GroupSchema Validation', () => {
        describe('Basic Group Structure', () => {
            const groupSchema: GroupSchema = {
                kind: 'group',
                of: {
                    option1: { kind: 'string' },
                    option2: { kind: 'number' }
                }
            };

            it('should validate when all properties are present and correct', () => {
                validate(groupSchema, true, [
                    { option1: 'test', option2: 42 }
                ]);
            });

            it('should fail when properties are missing', () => {
                validate(groupSchema, false, [
                    { option1: 'test' },
                    { option2: 42 },
                    {}
                ]);
            });

            it('should fail when property types are incorrect', () => {
                validate(groupSchema, false, [
                    { option1: 42, option2: 'test' },
                    { option1: true, option2: [] }
                ]);
            });

            it('should fail for non-object values', () => {
                validate(groupSchema, false, [
                    'string',
                    42,
                    true,
                    null,
                    undefined,
                    [],
                    () => { }
                ]);
            });
        });

        describe('Group with Selected Option', () => {
            const groupSchemaWithSelection: GroupSchema = {
                kind: 'group',
                of: {
                    option1: { kind: 'string' },
                    option2: { kind: 'number' }
                },
                selected: 'option1'
            };

            it('should validate when selected option is present and correct', () => {
                validate(groupSchemaWithSelection, true, [
                    'test',
                    'another string'
                ]);
            });

            it('should fail when selected option is incorrect type', () => {
                validate(groupSchemaWithSelection, false, [
                    42,
                    true,
                    null,
                    undefined,
                    [],
                    {},
                    () => { }
                ]);
            });
        });

        describe('Group with Invalid Selection', () => {
            const invalidGroupSchema: GroupSchema = {
                kind: 'group',
                of: {
                    option1: { kind: 'string' },
                    option2: { kind: 'number' }
                },
                selected: 'nonexistent'
            };

            it('should fail for any value when selection is invalid', () => {
                validate(invalidGroupSchema, false, [
                    'test',
                    42,
                    true,
                    null,
                    undefined,
                    [],
                    {},
                    () => { }
                ]);
            });
        });

        describe('Group with isOptional flag', () => {
            const groupSchemaWithOptional: GroupSchema = {
                kind: 'group',
                of: {
                    requiredOption: { kind: 'string' },
                    optionalOption: { kind: 'number', isOptional: true }
                }
            };

            it('should ignore isOptional flag and require all properties', () => {
                validate(groupSchemaWithOptional, true, [
                    { requiredOption: 'test', optionalOption: 42 }
                ]);

                validate(groupSchemaWithOptional, false, [
                    { requiredOption: 'test' },
                    { optionalOption: 42 },
                    { requiredOption: 'test', optionalOption: 'not a number' }
                ]);
            });
        });

        describe('Nested Group Schemas', () => {
            const nestedGroupSchema: GroupSchema = {
                kind: 'group',
                of: {
                    nested: {
                        kind: 'group',
                        of: {
                            option1: { kind: 'string' },
                            option2: { kind: 'number' }
                        }
                    }
                }
            };

            it('should validate correct nested structures', () => {
                validate(nestedGroupSchema, true, [
                    { nested: { option1: 'test', option2: 42 } }
                ]);
            });

            it('should fail for incorrect nested structures', () => {
                validate(nestedGroupSchema, false, [
                    { nested: { option1: 'test' } },
                    { nested: { option2: 42 } },
                    { nested: {} },
                    { nested: 'not an object' },
                    {}
                ]);
            });
        });

        describe('Group with Complex Schemas', () => {
            const complexGroupSchema: GroupSchema = {
                kind: 'group',
                of: {
                    arrayOption: { kind: 'array', of: { kind: 'string' } },
                    objectOption: {
                        kind: 'object',
                        of: {
                            prop1: { kind: 'number' },
                            prop2: { kind: 'boolean' }
                        }
                    }
                }
            };

            it('should validate correct complex structures', () => {
                validate(complexGroupSchema, true, [
                    {
                        arrayOption: ['test', 'strings'],
                        objectOption: { prop1: 42, prop2: true }
                    }
                ]);
            });

            it('should fail for incorrect complex structures', () => {
                validate(complexGroupSchema, false, [
                    {
                        arrayOption: ['test', 42],
                        objectOption: { prop1: 42, prop2: true }
                    },
                    {
                        arrayOption: ['test', 'strings'],
                        objectOption: { prop1: '42', prop2: true }
                    },
                    {
                        arrayOption: 'not an array',
                        objectOption: { prop1: 42, prop2: true }
                    },
                    {
                        arrayOption: ['test', 'strings'],
                        objectOption: 'not an object'
                    }
                ]);
            });
        });
    });

    describe('UnionSchema Validation', () => {
        describe('Simple Union Types', () => {
            const unionSchema: UnionSchema = {
                kind: 'union',
                of: [
                    { kind: 'string' },
                    { kind: 'number' },
                    { kind: 'boolean' }
                ]
            };

            it('should validate values matching any of the union types', () => {
                validate(unionSchema, true, ['hello', 42, true, false, 3.14]);
            });

            it('should reject values not matching any union type', () => {
                validate(unionSchema, false, [null, undefined, [], {}, Symbol('test')]);
            });
        });

        describe('Complex Union Types', () => {
            const complexUnionSchema: UnionSchema = {
                kind: 'union',
                of: [
                    { kind: 'array', of: { kind: 'string' } },
                    { kind: 'object', of: { name: { kind: 'string' }, age: { kind: 'number' } } },
                    { kind: 'literal', of: 'special' }
                ]
            };

            it('should validate complex union types correctly', () => {
                validate(complexUnionSchema, true, [
                    ['a', 'b', 'c'],
                    { name: 'John', age: 30 },
                    'special'
                ]);
            });

            it('should reject values not matching complex union types', () => {
                validate(complexUnionSchema, false, [
                    [1, 2, 3],
                    { name: 'John', age: '30' },
                    'not special',
                    42,
                    true
                ]);
            });
        });

        describe('Nested Union Types', () => {
            const nestedUnionSchema: UnionSchema = {
                kind: 'union',
                of: [
                    { kind: 'number' },
                    {
                        kind: 'union',
                        of: [
                            { kind: 'string' },
                            { kind: 'boolean' }
                        ]
                    }
                ]
            };

            it('should validate nested union types correctly', () => {
                validate(nestedUnionSchema, true, [42, 'hello', true, false, 3.14]);
            });

            it('should reject values not matching nested union types', () => {
                validate(nestedUnionSchema, false, [null, undefined, [], {}, Symbol('test')]);
            });
        });

        describe('Union with Bounded Types', () => {
            const boundedUnionSchema: UnionSchema = {
                kind: 'union',
                of: [
                    { kind: 'number', min: 0, max: 100 },
                    { kind: 'string', min: 5, max: 10 }
                ]
            };

            it('should validate values within bounds', () => {
                validate(boundedUnionSchema, true, [0, 50, 100, 'hello', 'world']);
            });

            it('should reject values outside bounds', () => {
                validate(boundedUnionSchema, false, [-1, 101, 'hi', 'this is too long']);
            });
        });

        describe('Union with Optional Properties', () => {
            const optionalUnionSchema: UnionSchema = {
                kind: 'union',
                of: [
                    { kind: 'number' },
                    {
                        kind: 'object',
                        of: {
                            required: { kind: 'string' },
                            optional: { kind: 'boolean', isOptional: true }
                        }
                    }
                ]
            };

            it('should validate objects with optional properties', () => {
                validate(optionalUnionSchema, true, [
                    42,
                    { required: 'hello' },
                    { required: 'world', optional: true }
                ]);
            });

            it('should reject invalid objects or missing required properties', () => {
                validate(optionalUnionSchema, false, [
                    { optional: true },
                    { required: 42 },
                    { required: 'hello', optional: 'not a boolean' }
                ]);
            });
        });

        describe('Error Accumulation in Union Types', () => {
            const unionSchema: UnionSchema = {
                kind: 'union',
                of: [
                    { kind: 'number', min: 0, max: 10 },
                    { kind: 'string', min: 3, max: 5 }
                ]
            };

            it('should accumulate errors from all union types', () => {
                const result = validateSchema('invalid', unionSchema, [], makeContext());
                expect(Array.isArray(result)).toBe(true);
                if (Array.isArray(result)) {
                    expect(result.length).toBeGreaterThanOrEqual(2); // At least one error for each failed union type
                }
            });
        });

        describe('Unions of Literals (Enum-like Unions)', () => {
            const enumUnionSchema: UnionSchema = {
                kind: 'union',
                of: [
                    { kind: 'literal', of: 'red' },
                    { kind: 'literal', of: 'green' },
                    { kind: 'literal', of: 'blue' },
                    { kind: 'literal', of: 1 },
                    { kind: 'literal', of: 2 },
                    { kind: 'literal', of: 3 },
                    { kind: 'literal', of: true }
                ]
            };

            it('should validate values matching any of the literal unions', () => {
                validate(enumUnionSchema, true, ['red', 'green', 'blue', 1, 2, 3, true]);
            });

            it('should reject values not matching any literal in the union', () => {
                validate(enumUnionSchema, false, [
                    'yellow', 'RED', 'Blue', 0, 4, false, null, undefined, [], {}
                ]);
            });

            it('should accumulate errors for invalid values', () => {
                const result = validateSchema('invalid', enumUnionSchema, [], makeContext());
                expect(Array.isArray(result)).toBe(true);
                if (Array.isArray(result)) {
                    expect(result.length).toBeGreaterThanOrEqual(7); // At least one error for each failed literal match
                }
            });
        });

        describe('Unions of Same Type with Different Bounds or Patterns', () => {


            describe('Number Union with Non-overlapping Bounds', () => {
                const numberUnionSchema: UnionSchema = {
                    kind: 'union',
                    of: [
                        { kind: 'number', min: 0, xmax: 10 },
                        { kind: 'number', xmin: 10, max: 20 },
                        { kind: 'number', min: 100, max: 200 }
                    ]
                };

                it('should validate numbers within the specified ranges', () => {
                    validate(numberUnionSchema, true, [0, 5, 9.9, 10.1, 15, 20, 100, 150, 200]);
                });

                it('should reject numbers outside the specified ranges', () => {
                    validate(numberUnionSchema, false, [-1, 10, 99, 201]);
                });

                it('should accumulate errors for invalid values', () => {
                    const result = validateSchema(50, numberUnionSchema, [], makeContext());
                    expect(Array.isArray(result)).toBe(true);
                    if (Array.isArray(result)) {
                        expect(result.length).toBeGreaterThanOrEqual(3); // At least one error for each failed range check
                    }
                });
            });

            describe('String Union with Different Patterns', () => {
                const stringUnionSchema: UnionSchema = {
                    kind: 'union',
                    of: [
                        { kind: 'string', of: 'email' },
                        { kind: 'string', of: 'uuid' },
                        { kind: 'string', of: /^[A-Z]{3}-\d{3}$/ }
                    ]
                };

                it('should validate strings matching any of the patterns', () => {
                    validate(stringUnionSchema, true, [
                        'test@example.com',
                        '123e4567-e89b-12d3-a456-426614174000',
                        'ABC-123'
                    ]);
                });

                it('should reject strings not matching any pattern', () => {
                    validate(stringUnionSchema, false, [
                        'not-an-email',
                        'invalid-uuid',
                        'ABC-1234',
                        'abc-123',
                        'ABC123'
                    ]);
                });

                it('should accumulate errors for invalid values', () => {
                    const result = validateSchema('invalid', stringUnionSchema, [], makeContext());
                    expect(Array.isArray(result)).toBe(true);
                    if (Array.isArray(result)) {
                        expect(result.length).toBeGreaterThanOrEqual(3); // At least one error for each failed pattern match
                    }
                });
            });
        });
    });

    describe('ThisSchema Validation', () => {
        it('should validate correctly within an object schema', () => {
            const schema: ObjectSchema = {
                kind: 'object',
                of: {
                    self: { kind: 'this', isOptional: true },
                    name: { kind: 'string' }
                }
            };
            validate(schema, true, [{ self: { name: 'John' }, name: 'John' }]);
        });

        it('should validate correctly within a model schema', () => {
            const schema: ModelSchema = {
                kind: 'model',
                of: {
                    self: { kind: 'this', isOptional: true },
                    name: { kind: 'string' }
                }
            };
            validate(schema, true, [{ self: { name: 'John' }, name: 'John' }]);
        });

        it('should fail validation when not within an object or model schema', () => {
            const schema: ThisSchema = { kind: 'this' };
            validate(schema, false, [{ name: 'John' }]);
        });

        it('should fail validation when within a group schema', () => {
            const schema: GroupSchema = {
                kind: 'group',
                of: {
                    self: { kind: 'this', isOptional: true },
                    name: { kind: 'string' }
                }
            };
            validate(schema, false, [{ self: { name: 'John' }, name: 'John' }]);
        });
    });

    describe('RootSchema Validation', () => {
        it('should validate correctly within a nested object schema', () => {
            const schema: ObjectSchema = {
                kind: 'object',
                of: {
                    name: { kind: 'string' },
                    nested: {
                        kind: 'object',
                        of: {
                            age: { kind: 'number' },
                            root: { kind: 'root', isOptional: true },
                        }
                    },
                }
            };
            validate(schema, true, [{ name: 'John', nested: { root: { name: 'Jane', nested: { age: 12 } }, age: 10 }, }]);
        });

        it('should validate correctly with an embedded model schema', () => {
            const schema: ObjectSchema = {
                kind: 'object',
                of: {
                    name: { kind: 'string' },
                    nested: {
                        kind: 'model',
                        of: {
                            age: { kind: 'number' },
                            root: { kind: 'root', isOptional: true },
                        }
                    },
                }
            };
            validate(schema, true, [{ name: 'John', nested: { root: { age: 12 }, age: 10 }, }]);
        });


        it('should fail validation when not within an object or model schema', () => {
            const schema: RootSchema = { kind: 'root' };
            validate(schema, false, [{ name: 'John' }]);
        });

        it('should fail validation when within a group schema', () => {
            const schema: GroupSchema = {
                kind: 'group',
                of: {
                    root: { kind: 'root', isOptional: true },
                    name: { kind: 'string' }
                }
            };
            validate(schema, false, [{ root: { name: 'John' }, name: 'John' }]);
        });
    });

    describe('RefSchema Validation', () => {
        it('should validate correctly within a group schema', () => {
            const schema: GroupSchema = {
                kind: 'group',
                of: {
                    Post: {
                        kind: 'object',
                        of: {
                            id: { kind: 'integer' },
                            author: { kind: 'ref', of: 'User' },
                        }
                    },
                    User: {
                        kind: 'object',
                        of: {
                            name: { kind: 'string' }
                        }
                    }
                },
                selected: 'Post'
            };

            validate(schema, true, [{ id: 1, author: { name: 'John' }, }]);
        });

        it('should fail validation when referenced schema does not exist in group', () => {
            const schema: GroupSchema = {
                kind: 'group',
                of: {
                    option1: {
                        kind: 'object',
                        of: {
                            user: { kind: 'ref', of: 'NonExistent' },
                            id: { kind: 'integer' }
                        }
                    }
                }
            };
            validate(schema, false, [{ user: { name: 'John' }, id: 1 }]);
        });

        it('should fail validation when not within a group schema', () => {
            const schema: RefSchema = { kind: 'ref', of: 'User' };
            validate(schema, false, [{ name: 'John' }]);
        });
    });


    describe('Caching Mechanism', () => {
        it('should cache validation results for repeated validations', () => {
            const schema: StringSchema = { kind: 'string', min: 5 };
            const value = 'Hello, World!';
            const context = makeContext();

            // First validation
            const result1 = validateSchema(value, schema, [], context);
            expect(result1).toBe(true);

            // Second validation (should use cache)
            const result2 = validateSchema(value, schema, [], context);
            expect(result2).toBe(true);

            // Check cache
            const schemaCache = context.cache.get(schema);
            expect(schemaCache).toBeDefined();
            expect(schemaCache!.get(value)).toBe(true);
        });

        it('should cache validation results for different values of the same schema', () => {
            const schema: NumberSchema = { kind: 'number', min: 0, max: 100 };
            const context = makeContext();

            const validValues = [0, 50, 100];
            const invalidValues = [-1, 101, 'not a number'];

            validValues.forEach(value => {
                expect(validateSchema(value, schema, [], context)).toBe(true);
            });

            invalidValues.forEach(value => {
                expect(validateSchema(value, schema, [], context)).not.toBe(true);
            });

            const schemaCache = context.cache.get(schema);
            expect(schemaCache).toBeDefined();
            expect(schemaCache!.size).toBe(validValues.length + invalidValues.length);
        });
    });

    describe('Circular Reference Handling', () => {
        it('should handle simple circular references using "this" schema', () => {
            const schema: ObjectSchema = {
                kind: 'object',
                of: {
                    name: { kind: 'string' },
                    this: { kind: 'this', isOptional: true }
                }
            };

            type SchemaType = { name: string; this?: SchemaType; };

            const a: SchemaType = { name: 'John' };
            const b: SchemaType = { name: 'Jill' };
            a.this = b;
            b.this = a;

            validate(schema, true, [a, b]);
        });

        it('should handle deeply nested circular references', () => {
            const schema: ObjectSchema = {
                kind: 'object',
                of: {
                    name: { kind: 'string' },
                    child: {
                        kind: 'object',
                        of: {
                            name: { kind: 'string' },
                            child: { kind: 'this', isOptional: true }
                        },
                        isOptional: true
                    }
                }
            };

            type SchemaType = {
                name: string;
                child?: {
                    name: string;
                    child?: SchemaType;
                };
            };

            const a: SchemaType = { name: 'Generation 1' };
            const b: SchemaType = { name: 'Generation 2', child: { name: 'Child of Gen 2' } };
            const c: SchemaType = { name: 'Generation 3', child: { name: 'Child of Gen 3' } };

            a.child = b.child;
            b.child!.child = c;
            c.child!.child = a;

            validate(schema, true, [a, b, c]);
        });

        it('should handle arrays with circular references', () => {
            const schema: ObjectSchema = {
                kind: 'object',
                of: {
                    name: { kind: 'string' },
                    children: {
                        kind: 'array',
                        of: { kind: 'this' },
                        isOptional: true
                    }
                }
            };

            type SchemaType = {
                name: string;
                children?: SchemaType[];
            };

            const family: SchemaType = {
                name: 'Parent',
                children: [
                    { name: 'Child 1' },
                    { name: 'Child 2' }
                ]
            };

            family.children![0].children = [family.children![1]];
            family.children![1].children = [family];

            validate(schema, true, [family]);
        });
    });
});