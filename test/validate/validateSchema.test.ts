import { Schema, NullSchema, AnySchema, BooleanSchema, IntegerSchema, NumberSchema, LiteralSchema } from '@/Schema';
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
        const result = validateSchema(value, schema, [], makeContext()) === true;
        console.log(inspect({ value, result, expected }, { depth: null, colors: true }));
        expect(result).toBe(expected);
    });
};


describe('Testing validateSchema', () => {

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

});