import { AnyField, ArrayField, BooleanField, IntegerField, LiteralField, NullField, NumberField, RecordField, StringField, TupleField } from "@/Field";
import { validate } from "@/validate";


describe('Validation Tests', () => {
    describe('Null Field Tests', () => {
        const nullField: NullField = { kind: 'null' };

        it('should validate null', () => {
            const result = validate(null, nullField);
            expect(result.success).toBe(true);
        });

        it('should invalidate non-null values', () => {
            const invalidValues = [undefined, 0, '', false, {}, []];
            invalidValues.forEach(value => {
                const result = validate(value, nullField);
                expect(result.success).toBe(false);
                expect(result.success ? [] : result.issues).toHaveLength(1);
            });
        });
    });

    describe('Any Field Tests', () => {
        const anyField: AnyField = { kind: 'any' };

        it('should validate various types', () => {
            const validValues = [null, true, 42, 'string', [1, 2, 3], { key: 'value' }];
            validValues.forEach(value => {
                const result = validate(value, anyField);

                expect(result.success).toBe(true);

                expect(result.success ? value : undefined).toEqual(value);
            });
        });

        it('should invalidate various types', () => {
            const validValues = [undefined, new Date(), 102n, new Map<string, number>, { key: [{ x: new Date, y: undefined }, new Set<boolean>] }];

            validValues.forEach(value => {
                const result = validate(value, anyField);

                expect(result.success).toBe(false);

                expect((result.success ? [] : result.issues).length).toBeGreaterThan(0);
            });
        });
    });

    describe('Boolean Field Tests', () => {
        const booleanField: BooleanField = { kind: 'boolean' };

        it('should validate true and false', () => {
            [true, false].forEach(value => {
                const result = validate(value, booleanField);

                expect(result.success).toBe(true);
            });
        });

        it('should invalidate non-boolean values', () => {
            const invalidValues = [null, undefined, 0, 1, '', 'true', [], {}];

            invalidValues.forEach(value => {
                const result = validate(value, booleanField);

                expect(result.success).toBe(false);

                expect(result.success ? [] : result.issues).toHaveLength(1);
            });
        });
    });

    describe('Integer Field Tests', () => {
        const baseIntegerField: IntegerField = { kind: 'integer' };

        it('should validate integers', () => {
            const validValues = [-10, -1, 0, 1, 10, 100];

            validValues.forEach(value => {
                const result = validate(value, baseIntegerField);

                expect(result.success).toBe(true);
            });
        });

        it('should invalidate non-integers', () => {
            const invalidValues = [null, undefined, true, 3.14, 'string', [], {}, NaN, Infinity, -Infinity];

            invalidValues.forEach(value => {
                const result = validate(value, baseIntegerField);

                expect(result.success).toBe(false);

                expect(result.success ? [] : result.issues).toHaveLength(1);
            });
        });

        it('should respect min and max bounds', () => {
            const boundedField: IntegerField = { ...baseIntegerField, min: 0, max: 10 };

            [-1, 0, 5, 10, 11].forEach(value => {
                const result = validate(value, boundedField);

                expect(result.success).toBe(value >= 0 && value <= 10);

                if (!result.success) {
                    expect(result.issues).toHaveLength(1);
                }
            });
        });

        it('should respect xmin and xmax bounds', () => {
            const boundedField: IntegerField = { ...baseIntegerField, xmin: 0, xmax: 10 };

            [-1, 0, 5, 9, 10].forEach(value => {
                const result = validate(value, boundedField);

                expect(result.success).toBe(value > 0 && value < 10);

                if (!result.success) {
                    expect(result.issues).toHaveLength(1);
                }
            });
        });
    });

    describe('Number Field Tests', () => {
        const baseNumberField: NumberField = { kind: 'number' };

        it('should validate numbers', () => {
            const validValues = [-10.5, -1, 0, 1, 3.14, 100.001];

            validValues.forEach(value => {

                const result = validate(value, baseNumberField);

                expect(result.success).toBe(true);
            });
        });

        it('should invalidate non-numbers', () => {
            const invalidValues = [null, undefined, true, 'string', [], {}, NaN, Infinity, -Infinity];

            invalidValues.forEach(value => {
                const result = validate(value, baseNumberField);

                expect(result.success).toBe(false);

                expect(result.success ? [] : result.issues).toHaveLength(1);
            });
        });

        it('should respect min and max bounds', () => {
            const boundedField: NumberField = { ...baseNumberField, min: 0, max: 10 };

            [-0.1, 0, 5.5, 10, 10.1].forEach(value => {

                const result = validate(value, boundedField);

                expect(result.success).toBe(value >= 0 && value <= 10);

                if (!result.success) {
                    expect(result.issues).toHaveLength(1);
                }
            });
        });

        it('should respect xmin and xmax bounds', () => {
            const boundedField: NumberField = { ...baseNumberField, xmin: 0, xmax: 10 };

            [-0.1, 0, 5.5, 9.9, 10].forEach(value => {

                const result = validate(value, boundedField);

                expect(result.success).toBe(value > 0 && value < 10);

                if (!result.success) {
                    expect(result.issues).toHaveLength(1);
                }
            });
        });
    });

    describe('String Field Tests', () => {
        const baseStringField: StringField = { kind: 'string' };

        test('valid string', () => {
            const result = validate('hello', baseStringField);

            expect(result.success).toBe(true);
        });

        test('invalid non-string', () => {
            const result = validate(123, baseStringField);

            expect(result.success).toBe(false);

            expect((result.success ? [] : result.issues).length).toBe(1);
        });

        test('string length within bounds', () => {
            const field: StringField = { ...baseStringField, min: 2, max: 5 };

            expect(validate('h', field).success).toBe(false);

            expect(validate('hi', field).success).toBe(true);

            expect(validate('hell', field).success).toBe(true);

            expect(validate('hello', field).success).toBe(true);

            expect(validate('hello!', field).success).toBe(false);
        });

        test('string length within bounds', () => {
            const field: StringField = { ...baseStringField, xmin: 2, xmax: 5 };

            expect(validate('h', field).success).toBe(false);

            expect(validate('hi', field).success).toBe(false);

            expect(validate('hell', field).success).toBe(true);

            expect(validate('hello', field).success).toBe(false);

            expect(validate('hello!', field).success).toBe(false);
        });

        test('date pattern matching', () => {
            const dateField: StringField = { ...baseStringField, of: 'date' };

            expect(validate('2023-05-15', dateField).success).toBe(true);

            expect(validate('2023-13-32', dateField).success).toBe(false);

            expect(validate('05-15-2023', dateField).success).toBe(false);
        });

        test('time pattern matching', () => {
            const timeField: StringField = { ...baseStringField, of: 'time' };

            expect(validate('14:30:00', timeField).success).toBe(true);

            expect(validate('14:30:00Z', timeField).success).toBe(true);

            expect(validate('14:30:00+01:00', timeField).success).toBe(true);

            expect(validate('25:00:00', timeField).success).toBe(false);

            expect(validate('14:60:00', timeField).success).toBe(false);
        });

        test('datetime pattern matching', () => {
            const datetimeField: StringField = { ...baseStringField, of: 'datetime' };
            expect(validate('2023-05-15T14:30:00Z', datetimeField).success).toBe(true);
            expect(validate('2023-05-15T14:30:00+01:00', datetimeField).success).toBe(true);
            expect(validate('2023-05-15 14:30:00', datetimeField).success).toBe(false);
            expect(validate('2023-13-32T25:00:00Z', datetimeField).success).toBe(false);
        });

        test('uuid pattern matching', () => {
            const uuidField: StringField = { ...baseStringField, of: 'uuid' };
            expect(validate('550e8400-e29b-41d4-a716-446655440000', uuidField).success).toBe(true);
            expect(validate('550e8400-e29b-41d4-a716-44665544000', uuidField).success).toBe(false);
            expect(validate('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx', uuidField).success).toBe(false);
        });

        test('email pattern matching', () => {
            const emailField: StringField = { ...baseStringField, of: 'email' };
            expect(validate('test@example.com', emailField).success).toBe(true);
            expect(validate('test.name+tag@example.co.uk', emailField).success).toBe(true);
            expect(validate('invalid-email', emailField).success).toBe(false);
            expect(validate('test@example', emailField).success).toBe(false);
        });

        test('base64 pattern matching', () => {
            const base64Field: StringField = { ...baseStringField, of: 'base64' };
            expect(validate('SGVsbG8gV29ybGQ=', base64Field).success).toBe(true);
            expect(validate('SGVsbG8gV29ybGQ', base64Field).success).toBe(true);
            expect(validate('SGVsbG8gV29ybGQ==', base64Field).success).toBe(true);
            expect(validate('SGVsbG8gV29ybGQ!', base64Field).success).toBe(false);
            expect(validate('SGVsbG8=V29ybGQ=', base64Field).success).toBe(false);
        });

        test('custom regex pattern', () => {
            const hexColorField: StringField = { ...baseStringField, of: /^#[0-9A-Fa-f]{6}$/ };
            expect(validate('#FF00FF', hexColorField).success).toBe(true);
            expect(validate('#G123AB', hexColorField).success).toBe(false);
            expect(validate('invalid-color', hexColorField).success).toBe(false);
        });
    });

    describe('Literal Field Tests', () => {
        test('valid boolean literal', () => {
            const field: LiteralField = { kind: 'literal', of: true };

            expect(validate(true, field).success).toBe(true);

            expect(validate(false, field).success).toBe(false);
        });

        test('valid number literal', () => {
            const field: LiteralField = { kind: 'literal', of: 42 };
            expect(validate(42, field).success).toBe(true);
            expect(validate(41, field).success).toBe(false);
        });

        test('valid string literal', () => {
            const field: LiteralField = { kind: 'literal', of: 'hello' };

            expect(validate('hello', field).success).toBe(true);

            expect(validate('world', field).success).toBe(false);
        });

        test('invalid non-matching type', () => {
            const field: LiteralField = { kind: 'literal', of: 'hello' };
            expect(validate(123, field).success).toBe(false);
        });
    });

    describe('Array Field Tests', () => {
        const numberArrayField: ArrayField = { kind: 'array', of: { kind: 'number' } };

        test('valid array with correct item types', () => {
            expect(validate([1, 2, 3], numberArrayField).success).toBe(true);
        });

        test('invalid non-array', () => {
            expect(validate('not an array', numberArrayField).success).toBe(false);
        });

        test('array with invalid item types', () => {
            const result = validate([1, '2', 3], numberArrayField);
            expect(result.success).toBe(false);
            expect((result.success ? [] : result.issues).length).toBe(1);
        });

        test('array length within bounds', () => {
            const boundedArrayField: ArrayField = { ...numberArrayField, min: 2, max: 4 };
            expect(validate([1, 2], boundedArrayField).success).toBe(true);
            expect(validate([1, 2, 3, 4], boundedArrayField).success).toBe(true);
            expect(validate([1], boundedArrayField).success).toBe(false);
            expect(validate([1, 2, 3, 4, 5], boundedArrayField).success).toBe(false);
        });
    });

    describe('Tuple Field Tests', () => {
        const tupleField: TupleField = {
            kind: 'tuple',
            of: [{ kind: 'string' }, { kind: 'number' }, { kind: 'boolean' }]
        };

        test('valid tuple with correct types', () => {
            expect(validate(['hello', 42, true], tupleField).success).toBe(true);
        });

        test('invalid non-tuple', () => {
            expect(validate('not a tuple', tupleField).success).toBe(false);
        });

        test('tuple with incorrect types', () => {
            const result = validate([42, 'hello', true], tupleField);
            expect(result.success).toBe(false);
            expect((result.success ? [] : result.issues).length).toBe(2);
        });

        test('tuple with missing elements', () => {
            expect(validate(['hello', 42], tupleField).success).toBe(false);
        });

        test('tuple with extra elements', () => {
            expect(validate(['hello', 42, true, 'extra'], tupleField).success).toBe(false);
        });

        test('tuple with optional rest elements', () => {
            const tupleWithRest: TupleField = {
                ...tupleField,
                rest: { kind: 'array', of: { kind: 'string' } }
            };
            expect(validate(['hello', 42, true, 'extra1', 'extra2'], tupleWithRest).success).toBe(true);
            expect(validate(['hello', 42, true, 123], tupleWithRest).success).toBe(false);
        });
    });

    describe('Record Field Tests', () => {
        const baseRecordField: RecordField = {
            kind: 'record',
            of: { kind: 'number' }
        };

        test('valid record with correct key-value types', () => {
            expect(validate({ a: 1, b: 2, c: 3 }, baseRecordField).success).toBe(true);
        });

        test('invalid non-object', () => {
            expect(validate('not an object', baseRecordField).success).toBe(false);
        });

        test('record with invalid value types', () => {
            const result = validate({ a: 1, b: '2', c: 3 }, baseRecordField);
            expect(result.success).toBe(false);
            expect((result.success ? [] : result.issues).length).toBe(1);
        });

        test('record length within bounds', () => {
            const boundedRecordField: RecordField = { ...baseRecordField, min: 2, max: 4 };
            expect(validate({ a: 1, b: 2 }, boundedRecordField).success).toBe(true);
            expect(validate({ a: 1, b: 2, c: 3, d: 4 }, boundedRecordField).success).toBe(true);
            expect(validate({ a: 1 }, boundedRecordField).success).toBe(false);
            expect(validate({ a: 1, b: 2, c: 3, d: 4, e: 5 }, boundedRecordField).success).toBe(false);
        });

        test('record with key constraints', () => {
            const recordWithKeyConstraint: RecordField = {
                ...baseRecordField,
                key: { kind: 'string', of: /^[a-z]$/ }
            };
            expect(validate({ a: 1, b: 2 }, recordWithKeyConstraint).success).toBe(true);
            expect(validate({ a: 1, B: 2 }, recordWithKeyConstraint).success).toBe(false);
            expect(validate({ a: 1, ab: 2 }, recordWithKeyConstraint).success).toBe(false);
        });
    });
});