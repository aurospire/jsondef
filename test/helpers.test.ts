import * as j from '@/helpers';
import { expectType } from 'jestype';

describe('Builder Helpers', () => {
    // Testing basic field types and their optional versions
    describe('Field Type Tests', () => {
        it('should create and validate null fields, both regular and optional', () => {
            const field = j.null();
            expect(field.kind).toBe('null');
            expect(field.isOptional).toBe(false);
            type Inferred = j.infer<typeof field>;
            type Expected = null;
            expectType<Inferred>().toBe<Expected>();

            const optionalField = field.optional();
            expect(optionalField.isOptional).toBe(true);
            type InferredOptional = j.infer<typeof optionalField>;
            type ExpectedOptional = null;
            expectType<InferredOptional>().toBe<ExpectedOptional>();
        });

        it('should create and validate boolean fields, both regular and optional', () => {
            const field = j.boolean();
            expect(field.kind).toBe('boolean');
            expect(field.isOptional).toBe(false);
            type Inferred = j.infer<typeof field>;
            type Expected = boolean;
            expectType<Inferred>().toBe<Expected>();

            const optionalField = field.optional();
            expect(optionalField.isOptional).toBe(true);
            type InferredOptional = j.infer<typeof optionalField>;
            type ExpectedOptional = boolean;
            expectType<InferredOptional>().toBe<ExpectedOptional>();
        });

        it('should create an any field with correct type inference', () => {
            const field = j.any();
            expect(field.kind).toBe('any');
            type Inferred = j.infer<typeof field>;
            type Expected = any;
            expectType<Inferred>().toBe<Expected>();
        });
    });

    // Testing contextual 'this' and 'root' fields within and outside models
    describe('Contextual Field Tests', () => {
        it('should validate this and root fields within models', () => {
            const model = j.model('Model', {
                thisField: j.this().optional(),
                rootField: j.root().optional(),
            });
            expect(model.kind).toBe('model');
            type InferredModel = j.infer<typeof model>;
            type ExpectedModel = {
                thisField?: ExpectedModel;
                rootField?: ExpectedModel;
            };
            expectType<InferredModel>().toBe<ExpectedModel>();
        });

        it('should handle this and root fields without scope as undefined', () => {
            const thisField = j.this();
            const rootField = j.root();
            expect(thisField.kind).toBe('this');
            expect(rootField.kind).toBe('root');
            type InferredThis = j.infer<typeof thisField>;
            type ExpectedThis = never;
            type InferredRoot = j.infer<typeof rootField>;
            type ExpectedRoot = never;
            expectType<InferredThis>().toBe<ExpectedThis>();
            expectType<InferredRoot>().toBe<ExpectedRoot>();
        });
    });

    // Testing numeric fields with bounds
    describe('Numeric Field Bounds Tests', () => {
        it('should enforce bounds correctly on integer fields and handle invalid bounds', () => {
            const field = j.integer().bound({ min: 1, max: 100 });
            expect(field.kind).toBe('integer');
            expect(field.min).toBe(1);
            expect(field.max).toBe(100);
            type Inferred = j.infer<typeof field>;
            type Expected = number;
            expectType<Inferred>().toBe<Expected>();

            expect(() => j.integer().bound({ min: 100, max: 1 })).toThrow();
            expect(() => j.integer().bound({ min: -Infinity, max: 0 })).toThrow();
            expect(() => j.integer().bound({ min: 0, max: NaN })).toThrow();
            expect(() => j.integer().bound({ xmin: NaN, xmax: NaN })).toThrow();
        });
    });

    // Literal, Array, and Object fields
    describe('Literal, Array, and Object Field Tests', () => {
        it('should create literal fields and validate their types', () => {
            const field = j.literal('test');
            expect(field.kind).toBe('literal');
            expect(field.of).toBe('test');
            type Inferred = j.infer<typeof field>;
            type Expected = 'test';
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create array fields with type checks and bounds', () => {
            const field = j.array(j.number()).bound({ min: 1, max: 5 });
            expect(field.kind).toBe('array');
            expect(field.min).toBe(1);
            expect(field.max).toBe(5);
            type Inferred = j.infer<typeof field>;
            type Expected = number[];
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create object fields and ensure correct field types', () => {
            const field = j.object({ name: j.string(), age: j.number() });
            expect(field.kind).toBe('object');
            expect(field.of.name.kind).toBe('string');
            expect(field.of.age.kind).toBe('number');
            type Inferred = j.infer<typeof field>;
            type Expected = { name: string; age: number; };
            expectType<Inferred>().toBe<Expected>();
        });
    });

    // Reference and Group field tests
    describe('Reference and Group Tests', () => {
        it('should create reference fields and handle undefined references as never', () => {
            const refField = j.ref('Nonexistent');
            expect(refField.kind).toBe('ref');
            type Inferred = j.infer<typeof refField>;
            type Expected = never;
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create group fields and validate nested structures', () => {
            const field = j.group({
                User: j.object({ id: j.number(), name: j.string() }),
                Post: j.object({ title: j.string(), author: j.ref('User') })
            });
            expect(field.kind).toBe('group');
            type Inferred = j.infer<typeof field>;
            type Expected = {
                User: { id: number; name: string; },
                Post: { title: string; author: { id: number; name: string; }; };
            };
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create group fields with select', () => {
            const field = j.group({
                User: j.object({ id: j.number(), name: j.string() }),
                Post: j.object({ title: j.string(), author: j.ref('User') })
            }).select('Post');

            expect(field.kind).toBe('group');
            type Inferred = j.infer<typeof field>;
            type Expected = {
                User: { id: number; name: string; },
                Post: { title: string; author: { id: number; name: string; }; };
            }['Post'];

            expectType<Inferred>().toBe<Expected>();
        });
    });

    // Complex field combinations
    describe('Complex Field Combinations', () => {
        it('should handle complex union and composite fields', () => {
            const shape = j.union([
                j.object({ kind: j.literal('circle'), radius: j.number() }),
                j.object({ kind: j.literal('rectangle'), width: j.number(), height: j.number() })
            ]);
            expect(shape.kind).toBe('union');
            type Inferred = j.infer<typeof shape>;
            type Expected = { kind: 'circle'; radius: number; } | { kind: 'rectangle'; width: number; height: number; };
            expectType<Inferred>().toBe<Expected>();
        });
    });
});
