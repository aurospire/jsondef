import { AnySchema, ArraySchema, BooleanSchema, IntegerSchema, LiteralSchema, NullSchema, NumberSchema, RecordSchema, StringSchema, TupleSchema } from "@/Schema";
import { validate } from "@/validate";


describe('Validation Tests', () => {
    describe('Null Schema Tests', () => {
        const nullSchema: NullSchema = { kind: 'null' };

        it('should validate null', () => {
            const result = validate(null, nullSchema);
            expect(result.success).toBe(true);
        });

        it('should invalidate non-null values', () => {
            const invalidValues = [undefined, 0, '', false, {}, []];
            invalidValues.forEach(value => {
                const result = validate(value, nullSchema);
                expect(result.success).toBe(false);
                expect(result.success ? [] : result.issues).toHaveLength(1);
            });
        });
    });

    describe('Any Schema Tests', () => {
        const anySchema: AnySchema = { kind: 'any' };

        it('should validate various types', () => {
            const validValues = [null, true, 42, 'string', [1, 2, 3], { key: 'value' }];
            validValues.forEach(value => {
                const result = validate(value, anySchema);

                expect(result.success).toBe(true);

                expect(result.success ? value : undefined).toEqual(value);
            });
        });

        it('should invalidate various types', () => {
            const validValues = [undefined, new Date(), 102n, new Map<string, number>, { key: [{ x: new Date, y: undefined }, new Set<boolean>] }];

            validValues.forEach(value => {
                const result = validate(value, anySchema);

                expect(result.success).toBe(false);

                expect((result.success ? [] : result.issues).length).toBeGreaterThan(0);
            });
        });
    });

    describe('Boolean Schema Tests', () => {
        const booleanSchema: BooleanSchema = { kind: 'boolean' };

        it('should validate true and false', () => {
            [true, false].forEach(value => {
                const result = validate(value, booleanSchema);

                expect(result.success).toBe(true);
            });
        });

        it('should invalidate non-boolean values', () => {
            const invalidValues = [null, undefined, 0, 1, '', 'true', [], {}];

            invalidValues.forEach(value => {
                const result = validate(value, booleanSchema);

                expect(result.success).toBe(false);

                expect(result.success ? [] : result.issues).toHaveLength(1);
            });
        });
    });

    describe('Integer Schema Tests', () => {
        const baseIntegerSchema: IntegerSchema = { kind: 'integer' };

        it('should validate integers', () => {
            const validValues = [-10, -1, 0, 1, 10, 100];

            validValues.forEach(value => {
                const result = validate(value, baseIntegerSchema);

                expect(result.success).toBe(true);
            });
        });

        it('should invalidate non-integers', () => {
            const invalidValues = [null, undefined, true, 3.14, 'string', [], {}, NaN, Infinity, -Infinity];

            invalidValues.forEach(value => {
                const result = validate(value, baseIntegerSchema);

                expect(result.success).toBe(false);

                expect(result.success ? [] : result.issues).toHaveLength(1);
            });
        });

        it('should respect min and max bounds', () => {
            const boundedSchema: IntegerSchema = { ...baseIntegerSchema, min: 0, max: 10 };

            [-1, 0, 5, 10, 11].forEach(value => {
                const result = validate(value, boundedSchema);

                expect(result.success).toBe(value >= 0 && value <= 10);

                if (!result.success) {
                    expect(result.issues).toHaveLength(1);
                }
            });
        });

        it('should respect xmin and xmax bounds', () => {
            const boundedSchema: IntegerSchema = { ...baseIntegerSchema, xmin: 0, xmax: 10 };

            [-1, 0, 5, 9, 10].forEach(value => {
                const result = validate(value, boundedSchema);

                expect(result.success).toBe(value > 0 && value < 10);

                if (!result.success) {
                    expect(result.issues).toHaveLength(1);
                }
            });
        });
    });

    describe('Number Schema Tests', () => {
        const baseNumberSchema: NumberSchema = { kind: 'number' };

        it('should validate numbers', () => {
            const validValues = [-10.5, -1, 0, 1, 3.14, 100.001];

            validValues.forEach(value => {

                const result = validate(value, baseNumberSchema);

                expect(result.success).toBe(true);
            });
        });

        it('should invalidate non-numbers', () => {
            const invalidValues = [null, undefined, true, 'string', [], {}, NaN, Infinity, -Infinity];

            invalidValues.forEach(value => {
                const result = validate(value, baseNumberSchema);

                expect(result.success).toBe(false);

                expect(result.success ? [] : result.issues).toHaveLength(1);
            });
        });

        it('should respect min and max bounds', () => {
            const boundedSchema: NumberSchema = { ...baseNumberSchema, min: 0, max: 10 };

            [-0.1, 0, 5.5, 10, 10.1].forEach(value => {

                const result = validate(value, boundedSchema);

                expect(result.success).toBe(value >= 0 && value <= 10);

                if (!result.success) {
                    expect(result.issues).toHaveLength(1);
                }
            });
        });

        it('should respect xmin and xmax bounds', () => {
            const boundedSchema: NumberSchema = { ...baseNumberSchema, xmin: 0, xmax: 10 };

            [-0.1, 0, 5.5, 9.9, 10].forEach(value => {

                const result = validate(value, boundedSchema);

                expect(result.success).toBe(value > 0 && value < 10);

                if (!result.success) {
                    expect(result.issues).toHaveLength(1);
                }
            });
        });
    });

    describe('String Schema Tests', () => {
        const baseStringSchema: StringSchema = { kind: 'string' };

        test('valid string', () => {
            const result = validate('hello', baseStringSchema);

            expect(result.success).toBe(true);
        });

        test('invalid non-string', () => {
            const result = validate(123, baseStringSchema);

            expect(result.success).toBe(false);

            expect((result.success ? [] : result.issues).length).toBe(1);
        });

        test('string length within bounds', () => {
            const schema: StringSchema = { ...baseStringSchema, min: 2, max: 5 };

            expect(validate('h', schema).success).toBe(false);

            expect(validate('hi', schema).success).toBe(true);

            expect(validate('hell', schema).success).toBe(true);

            expect(validate('hello', schema).success).toBe(true);

            expect(validate('hello!', schema).success).toBe(false);
        });

        test('string length within bounds', () => {
            const schema: StringSchema = { ...baseStringSchema, xmin: 2, xmax: 5 };

            expect(validate('h', schema).success).toBe(false);

            expect(validate('hi', schema).success).toBe(false);

            expect(validate('hell', schema).success).toBe(true);

            expect(validate('hello', schema).success).toBe(false);

            expect(validate('hello!', schema).success).toBe(false);
        });

        test('date pattern matching', () => {
            const dateSchema: StringSchema = { ...baseStringSchema, of: 'date' };

            expect(validate('2023-05-15', dateSchema).success).toBe(true);

            expect(validate('2023-13-32', dateSchema).success).toBe(false);

            expect(validate('05-15-2023', dateSchema).success).toBe(false);
        });

        test('time pattern matching', () => {
            const timeSchema: StringSchema = { ...baseStringSchema, of: 'time' };

            expect(validate('14:30:00', timeSchema).success).toBe(true);

            expect(validate('14:30:00Z', timeSchema).success).toBe(true);

            expect(validate('14:30:00+01:00', timeSchema).success).toBe(true);

            expect(validate('25:00:00', timeSchema).success).toBe(false);

            expect(validate('14:60:00', timeSchema).success).toBe(false);
        });

        test('datetime pattern matching', () => {
            const datetimeSchema: StringSchema = { ...baseStringSchema, of: 'datetime' };
            expect(validate('2023-05-15T14:30:00Z', datetimeSchema).success).toBe(true);
            expect(validate('2023-05-15T14:30:00+01:00', datetimeSchema).success).toBe(true);
            expect(validate('2023-05-15 14:30:00', datetimeSchema).success).toBe(false);
            expect(validate('2023-13-32T25:00:00Z', datetimeSchema).success).toBe(false);
        });

        test('uuid pattern matching', () => {
            const uuidSchema: StringSchema = { ...baseStringSchema, of: 'uuid' };
            expect(validate('550e8400-e29b-41d4-a716-446655440000', uuidSchema).success).toBe(true);
            expect(validate('550e8400-e29b-41d4-a716-44665544000', uuidSchema).success).toBe(false);
            expect(validate('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx', uuidSchema).success).toBe(false);
        });

        test('email pattern matching', () => {
            const emailSchema: StringSchema = { ...baseStringSchema, of: 'email' };
            expect(validate('test@example.com', emailSchema).success).toBe(true);
            expect(validate('test.name+tag@example.co.uk', emailSchema).success).toBe(true);
            expect(validate('invalid-email', emailSchema).success).toBe(false);
            expect(validate('test@example', emailSchema).success).toBe(false);
        });

        test('base64 pattern matching', () => {
            const base64Schema: StringSchema = { ...baseStringSchema, of: 'base64' };
            expect(validate('SGVsbG8gV29ybGQ=', base64Schema).success).toBe(true);
            expect(validate('SGVsbG8gV29ybGQ', base64Schema).success).toBe(true);
            expect(validate('SGVsbG8gV29ybGQ==', base64Schema).success).toBe(true);
            expect(validate('SGVsbG8gV29ybGQ!', base64Schema).success).toBe(false);
            expect(validate('SGVsbG8=V29ybGQ=', base64Schema).success).toBe(false);
        });

        test('custom regex pattern', () => {
            const hexColorSchema: StringSchema = { ...baseStringSchema, of: /^#[0-9A-Fa-f]{6}$/ };
            expect(validate('#FF00FF', hexColorSchema).success).toBe(true);
            expect(validate('#G123AB', hexColorSchema).success).toBe(false);
            expect(validate('invalid-color', hexColorSchema).success).toBe(false);
        });
    });

    describe('Literal Schema Tests', () => {
        test('valid boolean literal', () => {
            const schema: LiteralSchema = { kind: 'literal', of: true };

            expect(validate(true, schema).success).toBe(true);

            expect(validate(false, schema).success).toBe(false);
        });

        test('valid number literal', () => {
            const schema: LiteralSchema = { kind: 'literal', of: 42 };
            expect(validate(42, schema).success).toBe(true);
            expect(validate(41, schema).success).toBe(false);
        });

        test('valid string literal', () => {
            const schema: LiteralSchema = { kind: 'literal', of: 'hello' };

            expect(validate('hello', schema).success).toBe(true);

            expect(validate('world', schema).success).toBe(false);
        });

        test('invalid non-matching type', () => {
            const schema: LiteralSchema = { kind: 'literal', of: 'hello' };
            expect(validate(123, schema).success).toBe(false);
        });
    });

    describe('Array Schema Tests', () => {
        const numberArraySchema: ArraySchema = { kind: 'array', of: { kind: 'number' } };

        test('valid array with correct item types', () => {
            expect(validate([1, 2, 3], numberArraySchema).success).toBe(true);
        });

        test('invalid non-array', () => {
            expect(validate('not an array', numberArraySchema).success).toBe(false);
        });

        test('array with invalid item types', () => {
            const result = validate([1, '2', 3], numberArraySchema);
            expect(result.success).toBe(false);
            expect((result.success ? [] : result.issues).length).toBe(1);
        });

        test('array length within bounds', () => {
            const boundedArraySchema: ArraySchema = { ...numberArraySchema, min: 2, max: 4 };
            expect(validate([1, 2], boundedArraySchema).success).toBe(true);
            expect(validate([1, 2, 3, 4], boundedArraySchema).success).toBe(true);
            expect(validate([1], boundedArraySchema).success).toBe(false);
            expect(validate([1, 2, 3, 4, 5], boundedArraySchema).success).toBe(false);
        });
    });

    describe('Tuple Schema Tests', () => {
        const tupleSchema: TupleSchema = {
            kind: 'tuple',
            of: [{ kind: 'string' }, { kind: 'number' }, { kind: 'boolean' }]
        };

        test('valid tuple with correct types', () => {
            expect(validate(['hello', 42, true], tupleSchema).success).toBe(true);
        });

        test('invalid non-tuple', () => {
            expect(validate('not a tuple', tupleSchema).success).toBe(false);
        });

        test('tuple with incorrect types', () => {
            const result = validate([42, 'hello', true], tupleSchema);
            expect(result.success).toBe(false);
            expect((result.success ? [] : result.issues).length).toBe(2);
        });

        test('tuple with missing elements', () => {
            expect(validate(['hello', 42], tupleSchema).success).toBe(false);
        });

        test('tuple with extra elements', () => {
            expect(validate(['hello', 42, true, 'extra'], tupleSchema).success).toBe(false);
        });

        test('tuple with optional rest elements', () => {
            const tupleWithRest: TupleSchema = {
                ...tupleSchema,
                rest: { kind: 'array', of: { kind: 'string' } }
            };
            expect(validate(['hello', 42, true, 'extra1', 'extra2'], tupleWithRest).success).toBe(true);
            expect(validate(['hello', 42, true, 123], tupleWithRest).success).toBe(false);
        });
    });

    describe('Record Schema Tests', () => {
        const baseRecordSchema: RecordSchema = {
            kind: 'record',
            of: { kind: 'number' }
        };

        test('valid record with correct key-value types', () => {
            expect(validate({ a: 1, b: 2, c: 3 }, baseRecordSchema).success).toBe(true);
        });

        test('invalid non-object', () => {
            expect(validate('not an object', baseRecordSchema).success).toBe(false);
        });

        test('record with invalid value types', () => {
            const result = validate({ a: 1, b: '2', c: 3 }, baseRecordSchema);
            expect(result.success).toBe(false);
            expect((result.success ? [] : result.issues).length).toBe(1);
        });

        test('record length within bounds', () => {
            const boundedRecordSchema: RecordSchema = { ...baseRecordSchema, min: 2, max: 4 };
            expect(validate({ a: 1, b: 2 }, boundedRecordSchema).success).toBe(true);
            expect(validate({ a: 1, b: 2, c: 3, d: 4 }, boundedRecordSchema).success).toBe(true);
            expect(validate({ a: 1 }, boundedRecordSchema).success).toBe(false);
            expect(validate({ a: 1, b: 2, c: 3, d: 4, e: 5 }, boundedRecordSchema).success).toBe(false);
        });

        test('record with key constraints', () => {
            const recordWithKeyConstraint: RecordSchema = {
                ...baseRecordSchema,
                key: { kind: 'string', of: /^[a-z]$/ }
            };
            expect(validate({ a: 1, b: 2 }, recordWithKeyConstraint).success).toBe(true);
            expect(validate({ a: 1, B: 2 }, recordWithKeyConstraint).success).toBe(false);
            expect(validate({ a: 1, ab: 2 }, recordWithKeyConstraint).success).toBe(false);
        });
    });
});