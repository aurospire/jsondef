import { AnyField, BooleanField, IntegerField, NullField, NumberField } from "@/Field";
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
});