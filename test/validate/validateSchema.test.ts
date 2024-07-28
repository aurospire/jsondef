import { Schema, NullSchema, AnySchema, BooleanSchema, IntegerSchema, NumberSchema } from '@/Schema';
import { makeContext } from '@/validate/Context';
import { validateSchema } from '@/validate/validateSchema';

const validate = (schema: Schema, result: boolean, values: any[]) =>
    values.forEach(value => expect(validateSchema(value, schema, [], makeContext()) === true).toBe(result));

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
});