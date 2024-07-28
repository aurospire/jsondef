import * as j from '@/helpers';
import { expectType } from 'jestype';

describe('Builder Helpers', () => {
    // Testing basic schema types and their optional versions
    describe('Schema Type Tests', () => {
        it('should create and validate null schemas, both regular and optional', () => {
            const schema = j.null();
            expect(schema.kind).toBe('null');
            expect(schema.isOptional).toBe(false);
            type Inferred = j.infer<typeof schema>;
            type Expected = null;
            expectType<Inferred>().toBe<Expected>();

            const optionalSchema = schema.optional();
            expect(optionalSchema.isOptional).toBe(true);
            type InferredOptional = j.infer<typeof optionalSchema>;
            type ExpectedOptional = null;
            expectType<InferredOptional>().toBe<ExpectedOptional>();
        });

        it('should create and validate boolean schemas, both regular and optional', () => {
            const schema = j.boolean();
            expect(schema.kind).toBe('boolean');
            expect(schema.isOptional).toBe(false);
            type Inferred = j.infer<typeof schema>;
            type Expected = boolean;
            expectType<Inferred>().toBe<Expected>();

            const optionalSchema = schema.optional();
            expect(optionalSchema.isOptional).toBe(true);
            type InferredOptional = j.infer<typeof optionalSchema>;
            type ExpectedOptional = boolean;
            expectType<InferredOptional>().toBe<ExpectedOptional>();
        });

        it('should create an any schema with correct type inference', () => {
            const schema = j.any();
            expect(schema.kind).toBe('any');
            type Inferred = j.infer<typeof schema>;
            type Expected = any;
            expectType<Inferred>().toBe<Expected>();
        });
    });

    // Testing contextual 'this' and 'root' schemas within and outside models
    describe('Contextual Schema Tests', () => {
        it('should validate this and root schemas within models', () => {
            const model = j.model('Model', {
                thisSchema: j.this().optional(),
                rootSchema: j.root().optional(),
            });
            expect(model.kind).toBe('model');
            type InferredModel = j.infer<typeof model>;
            type ExpectedModel = {
                thisSchema?: ExpectedModel;
                rootSchema?: ExpectedModel;
            };
            expectType<InferredModel>().toBe<ExpectedModel>();
        });

        it('should handle this and root schemas without scope as undefined', () => {
            const thisSchema = j.this();
            const rootSchema = j.root();
            expect(thisSchema.kind).toBe('this');
            expect(rootSchema.kind).toBe('root');
            type InferredThis = j.infer<typeof thisSchema>;
            type ExpectedThis = never;
            type InferredRoot = j.infer<typeof rootSchema>;
            type ExpectedRoot = never;
            expectType<InferredThis>().toBe<ExpectedThis>();
            expectType<InferredRoot>().toBe<ExpectedRoot>();
        });
    });

    // Testing numeric schemas with bounds
    describe('Numeric Schema Bounds Tests', () => {
        it('should enforce bounds correctly on integer schemas and handle invalid bounds', () => {
            const schema = j.integer().bound({ min: 1, max: 100 });
            expect(schema.kind).toBe('integer');
            expect(schema.min).toBe(1);
            expect(schema.max).toBe(100);
            type Inferred = j.infer<typeof schema>;
            type Expected = number;
            expectType<Inferred>().toBe<Expected>();

            expect(() => j.integer().bound({ min: 100, max: 1 })).toThrow();
            expect(() => j.integer().bound({ min: -Infinity, max: 0 })).toThrow();
            expect(() => j.integer().bound({ min: 0, max: NaN })).toThrow();
            expect(() => j.integer().bound({ xmin: NaN, xmax: NaN })).toThrow();
        });
    });

    // Literal, Array, and Object schemas
    describe('Literal, Array, and Object Schema Tests', () => {
        it('should create literal schemas and validate their types', () => {
            const schema = j.literal('test');
            expect(schema.kind).toBe('literal');
            expect(schema.of).toBe('test');
            type Inferred = j.infer<typeof schema>;
            type Expected = 'test';
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create array schemas with type checks and bounds', () => {
            const schema = j.array(j.number()).bound({ min: 1, max: 5 });
            expect(schema.kind).toBe('array');
            expect(schema.min).toBe(1);
            expect(schema.max).toBe(5);
            type Inferred = j.infer<typeof schema>;
            type Expected = number[];
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create object schemas and ensure correct schema types', () => {
            const schema = j.object({ name: j.string(), age: j.number() });
            expect(schema.kind).toBe('object');
            expect(schema.of.name.kind).toBe('string');
            expect(schema.of.age.kind).toBe('number');
            type Inferred = j.infer<typeof schema>;
            type Expected = { name: string; age: number; };
            expectType<Inferred>().toBe<Expected>();
        });
    });

    // Reference and Group schema tests
    describe('Reference and Group Tests', () => {
        it('should create reference schemas and handle undefined references as never', () => {
            const refSchema = j.ref('Nonexistent');
            expect(refSchema.kind).toBe('ref');
            type Inferred = j.infer<typeof refSchema>;
            type Expected = never;
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create group schemas and validate nested structures', () => {
            const schema = j.group({
                User: j.object({ id: j.number(), name: j.string() }),
                Post: j.object({ title: j.string(), author: j.ref('User') })
            });
            expect(schema.kind).toBe('group');
            type Inferred = j.infer<typeof schema>;
            type Expected = {
                User: { id: number; name: string; },
                Post: { title: string; author: { id: number; name: string; }; };
            };
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create group schemas with select', () => {
            const schema = j.group({
                User: j.object({ id: j.number(), name: j.string() }),
                Post: j.object({ title: j.string(), author: j.ref('User') })
            }).select('Post');

            expect(schema.kind).toBe('group');
            type Inferred = j.infer<typeof schema>;
            type Expected = {
                User: { id: number; name: string; },
                Post: { title: string; author: { id: number; name: string; }; };
            }['Post'];

            expectType<Inferred>().toBe<Expected>();
        });
    });

    // Complex schema combinations
    describe('Complex Schema Combinations', () => {
        it('should handle complex union and composite schemas', () => {
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
