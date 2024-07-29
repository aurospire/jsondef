import { Schema, NullSchema, AnySchema, BooleanSchema, IntegerSchema, NumberSchema, LiteralSchema, StringSchema, ArraySchema, TupleSchema } from '@/Schema';
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
                validateShow(schema, false, [
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
});