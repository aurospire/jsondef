import * as j from '@/builder/helpers';
import { expectType } from 'jestype';

describe('Jestype Builder Helpers', () => {
    describe('nullField', () => {
        it('should create a null field', () => {
            const field = j.null();
            expect(field.kind).toBe('null');
            expectType<j.infer<typeof field>>().toBe<null>();
        });

        it('should allow optional null field', () => {
            const field = j.null().optional();
            expect(field.isOptional).toBe(true);
            expectType<j.infer<typeof field>>().toBe<null>();
        });
    });

    describe('anyField', () => {
        it('should create an any field', () => {
            const field = j.any();
            expect(field.kind).toBe('any');
        });
    });

    describe('thisField', () => {
        it('should create a this field', () => {
            const field = j.this();
            expect(field.kind).toBe('this');
        });
    });

    describe('rootField', () => {
        it('should create a root field', () => {
            const field = j.root();
            expect(field.kind).toBe('root');
            // Note: We can't test the inferred type of 'root' as it depends on context
        });
    });

    describe('booleanField', () => {
        it('should create a boolean field', () => {
            const field = j.boolean();
            expect(field.kind).toBe('boolean');
            expectType<j.infer<typeof field>>().toBe<boolean>();
        });
    });

    describe('integerField', () => {
        it('should create an integer field', () => {
            const field = j.integer();
            expect(field.kind).toBe('integer');
            expectType<j.infer<typeof field>>().toBe<number>();
        });

        it('should allow bounds on integer field', () => {
            const field = j.integer().bound({ min: 0, max: 10 });
            expect(field.min).toBe(0);
            expect(field.max).toBe(10);
        });

        it('should throw error for invalid bounds', () => {
            expect(() => j.integer().bound({ min: 10, max: 0 })).toThrow();
        });
    });

    describe('numberField', () => {
        it('should create a number field', () => {
            const field = j.number();
            expect(field.kind).toBe('number');
            expectType<j.infer<typeof field>>().toBe<number>();
        });

        it('should allow bounds on number field', () => {
            const field = j.number().bound({ xmin: 0, xmax: 1 });
            expect(field.xmin).toBe(0);
            expect(field.xmax).toBe(1);
        });
    });

    describe('stringField', () => {
        it('should create a string field', () => {
            const field = j.string();
            expect(field.kind).toBe('string');
            expectType<j.infer<typeof field>>().toBe<string>();
        });

        it('should allow pattern on string field', () => {
            const field = j.string().pattern('email');
            expect(field.of).toBe('email');
        });

        it('should allow regex pattern on string field', () => {
            const field = j.string().regex(/^[a-z]+$/);
            expect(field.of).toBeInstanceOf(RegExp);
        });
    });

    describe('literalField', () => {
        it('should create a literal field with string', () => {
            const field = j.literal('test');
            expect(field.kind).toBe('literal');
            expect(field.of).toBe('test');
            expectType<j.infer<typeof field>>().toBe<'test'>();
        });

        it('should create a literal field with number', () => {
            const field = j.literal(42);
            expect(field.of).toBe(42);
            expectType<j.infer<typeof field>>().toBe<42>();
        });

        it('should create a literal field with boolean', () => {
            const field = j.literal(true);
            expect(field.of).toBe(true);
            expectType<j.infer<typeof field>>().toBe<true>();
        });

        it('should throw error for invalid literal values', () => {
            expect(() => j.literal(NaN)).toThrow();
            expect(() => j.literal(Infinity)).toThrow();
        });
    });

    describe('arrayField', () => {
        it('should create an array field', () => {
            const field = j.array(j.string());
            expect(field.kind).toBe('array');
            expect(field.of.kind).toBe('string');

            type Inferred = j.infer<typeof field>;
            type Expected = string[];

            expectType<Inferred>().toBe<Expected>();
        });

        it('should allow bounds on array field', () => {
            const field = j.array(j.number()).bound({ min: 1, max: 5 });
            expect(field.min).toBe(1);
            expect(field.max).toBe(5);
        });
    });

    describe('tupleField', () => {
        it('should create a tuple field', () => {
            const field = j.tuple([j.string(), j.number()]);
            expect(field.kind).toBe('tuple');
            expect(field.of.length).toBe(2);
            type Inferred = j.infer<typeof field>;
            type Expected = [string, number];
            expectType<Inferred>().toBe<Expected>();
        });

        it('should allow rest element in tuple field', () => {
            const field = j.tuple([j.string(), j.number()], j.boolean());
            expect(field.rest?.kind).toBe('boolean');
            type Inferred = j.infer<typeof field>;
            type Expected = [string, number, ...boolean[]];
            expectType<Inferred>().toBe<Expected>();
        });
    });

    describe('recordField', () => {
        it('should create a record field', () => {
            const field = j.record(j.number());
            expect(field.kind).toBe('record');
            expect(field.of?.kind).toBe('number');
            expectType<j.infer<typeof field>>().toBe<{ [key: string]: number; }>();
        });

        it('should allow key specification for record field', () => {
            const field = j.record(j.string()).by(j.string().pattern('email'));
            expect(field.key?.of).toBe('email');
        });
    });

    describe('objectField', () => {
        it('should create an object field', () => {
            const field = j.object({
                name: j.string(),
                age: j.number()
            });
            expect(field.kind).toBe('object');
            expect(field.of.name.kind).toBe('string');
            expect(field.of.age.kind).toBe('number');
            expectType<j.infer<typeof field>>().toBe<{ name: string; age: number; }>();
        });
    });

    describe('modelField', () => {
        it('should create a model field', () => {
            const field = j.model('User', {
                id: j.number(),
                name: j.string()
            });
            expect(field.kind).toBe('model');
            expect(field.name).toBe('User');
            expect(field.of.id.kind).toBe('number');
            expect(field.of.name.kind).toBe('string');
            expectType<j.infer<typeof field>>().toBe<{ id: number; name: string; }>();
        });
    });

    describe('compositeField', () => {
        it('should create a composite field', () => {
            const field = j.composite([
                j.object({ id: j.number() }),
                j.object({ name: j.string() })
            ]);
            expect(field.kind).toBe('composite');
            expect(field.of.length).toBe(2);
            expectType<j.infer<typeof field>>().toBe<{ id: number; } & { name: string; }>();
        });
    });

    describe('unionField', () => {
        it('should create a union field', () => {
            const field = j.union([j.string(), j.number()]);
            expect(field.kind).toBe('union');
            expect(field.of.length).toBe(2);
            expectType<j.infer<typeof field>>().toBe<string | number>();
        });
    });

    describe('refField', () => {
        it('should create a ref field', () => {
            const field = j.ref('User');
            expect(field.kind).toBe('ref');
            expect(field.of).toBe('User');
            // Note: We can't test the inferred type of a ref field as it depends on the namespace
        });
    });

    describe('Complex field combinations', () => {
        it('should handle nested field structures', () => {
            const userField = j.model('User', {
                id: j.number(),
                name: j.string(),
                email: j.string().pattern('email').optional(),
                roles: j.array(j.string()),
                settings: j.record(j.union([j.string(), j.number(), j.boolean()]))
            });

            expect(userField.kind).toBe('model');
            expect(userField.of.id.kind).toBe('number');
            expect(userField.of.email.isOptional).toBe(true);
            expect(userField.of.roles.of.kind).toBe('string');
            expect(userField.of.settings.of?.kind).toBe('union');

            type User = j.infer<typeof userField>;
            expectType<User>().toHave<{
                id: number;
                name: string;
                email?: string;
                roles: string[];
                settings: { [key: string]: string | number | boolean; };
            }>();
        });

        it('should handle complex union and composite fields', () => {
            const shape = j.union([
                j.object({ kind: j.literal('circle'), radius: j.number() }),
                j.object({ kind: j.literal('rectangle'), width: j.number(), height: j.number() })
            ]);

            expect(shape.kind).toBe('union');

            type Shape = j.infer<typeof shape>;
            expectType<Shape>().toBeOfUnion<
                { kind: 'circle'; radius: number; } | { kind: 'rectangle'; width: number; height: number; }
            >();
        });
    });
});