import * as d from '@/helpers';
import { expectType } from 'jestype';

describe('Builder Helpers', () => {
    // Testing basic schema types and their optional versions
    describe('Schema Type Tests', () => {
        it('should create and validate null schemas, both regular and optional', () => {
            const schema = d.null();
            expect(schema.kind).toBe('null');
            expect(schema.isOptional).toBe(false);
            type Inferred = d.infer<typeof schema>;
            type Expected = null;
            expectType<Inferred>().toBe<Expected>();

            const optionalSchema = schema.optional();
            expect(optionalSchema.isOptional).toBe(true);
            type InferredOptional = d.infer<typeof optionalSchema>;
            type ExpectedOptional = null;
            expectType<InferredOptional>().toBe<ExpectedOptional>();
        });

        it('should create and validate boolean schemas, both regular and optional', () => {
            const schema = d.boolean();
            expect(schema.kind).toBe('boolean');
            expect(schema.isOptional).toBe(false);
            type Inferred = d.infer<typeof schema>;
            type Expected = boolean;
            expectType<Inferred>().toBe<Expected>();

            const optionalSchema = schema.optional();
            expect(optionalSchema.isOptional).toBe(true);
            type InferredOptional = d.infer<typeof optionalSchema>;
            type ExpectedOptional = boolean;
            expectType<InferredOptional>().toBe<ExpectedOptional>();
        });

        it('should create an any schema with correct type inference', () => {
            const schema = d.any();
            expect(schema.kind).toBe('any');
            type Inferred = d.infer<typeof schema>;
            type Expected = any;
            expectType<Inferred>().toBe<Expected>();
        });
    });

    // Testing contextual 'this' and 'root' schemas within and outside models
    describe('Contextual Schema Tests', () => {
        it('should validate this and root schemas within models', () => {
            const model = d.model({
                thisSchema: d.this().optional(),
                rootSchema: d.root().optional(),
            });
            expect(model.kind).toBe('model');
            type InferredModel = d.infer<typeof model>;
            type ExpectedModel = {
                thisSchema?: ExpectedModel;
                rootSchema?: ExpectedModel;
            };
            expectType<InferredModel>().toBe<ExpectedModel>();
        });

        it('should handle this and root schemas without scope as undefined', () => {
            const thisSchema = d.this();
            const rootSchema = d.root();
            expect(thisSchema.kind).toBe('this');
            expect(rootSchema.kind).toBe('root');
            type InferredThis = d.infer<typeof thisSchema>;
            type ExpectedThis = never;
            type InferredRoot = d.infer<typeof rootSchema>;
            type ExpectedRoot = never;
            expectType<InferredThis>().toBe<ExpectedThis>();
            expectType<InferredRoot>().toBe<ExpectedRoot>();
        });
    });

    // Testing numeric schemas with bounds
    describe('Numeric Schema Bounds Tests', () => {
        it('should enforce bounds correctly on integer schemas and handle invalid bounds', () => {
            const schema = d.integer().bound({ min: 1, max: 100 });
            expect(schema.kind).toBe('integer');
            expect(schema.min).toBe(1);
            expect(schema.max).toBe(100);
            type Inferred = d.infer<typeof schema>;
            type Expected = number;
            expectType<Inferred>().toBe<Expected>();

            expect(() => d.integer().bound({ min: 100, max: 1 })).toThrow();
            expect(() => d.integer().bound({ min: -Infinity, max: 0 })).toThrow();
            expect(() => d.integer().bound({ min: 0, max: NaN })).toThrow();
            expect(() => d.integer().bound({ xmin: NaN, xmax: NaN })).toThrow();
        });
    });

    // Literal, Array, and Object schemas
    describe('Literal, Array, and Object Schema Tests', () => {
        it('should create literal schemas and validate their types', () => {
            const schema = d.literal('test');
            expect(schema.kind).toBe('literal');
            expect(schema.of).toBe('test');
            type Inferred = d.infer<typeof schema>;
            type Expected = 'test';
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create array schemas with type checks and bounds', () => {
            const schema = d.array(d.number()).size({ min: 1, max: 5 });
            expect(schema.kind).toBe('array');
            expect(schema.min).toBe(1);
            expect(schema.max).toBe(5);
            type Inferred = d.infer<typeof schema>;
            type Expected = number[];
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create object schemas and ensure correct schema types', () => {
            const schema = d.object({ name: d.string(), age: d.number() });
            expect(schema.kind).toBe('object');
            expect(schema.of.name.kind).toBe('string');
            expect(schema.of.age.kind).toBe('number');
            type Inferred = d.infer<typeof schema>;
            type Expected = { name: string; age: number; };
            expectType<Inferred>().toBe<Expected>();
        });
    });

    // Reference and Group schema tests
    describe('Reference and Group Tests', () => {
        it('should create reference schemas and handle undefined references as never', () => {
            const refSchema = d.ref('Nonexistent');
            expect(refSchema.kind).toBe('ref');
            type Inferred = d.infer<typeof refSchema>;
            type Expected = never;
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create group schemas and validate nested structures', () => {
            const schema = d.group({
                User: d.object({ id: d.number(), name: d.string() }),
                Post: d.object({ title: d.string(), author: d.ref('User') })
            });
            expect(schema.kind).toBe('group');
            type Inferred = d.infer<typeof schema>;
            type Expected = {
                User: { id: number; name: string; },
                Post: { title: string; author: { id: number; name: string; }; };
            };
            expectType<Inferred>().toBe<Expected>();
        });

        it('should create group schemas with select', () => {
            const schema = d.group({
                User: d.object({ id: d.number(), name: d.string() }),
                Post: d.object({ title: d.string(), author: d.ref('User') })
            }).select('Post');

            expect(schema.kind).toBe('group');
            type Inferred = d.infer<typeof schema>;
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
            const shape = d.union([
                d.object({ kind: d.literal('circle'), radius: d.number() }),
                d.object({ kind: d.literal('rectangle'), width: d.number(), height: d.number() })
            ]);
            expect(shape.kind).toBe('union');
            type Inferred = d.infer<typeof shape>;
            type Expected = { kind: 'circle'; radius: number; } | { kind: 'rectangle'; width: number; height: number; };
            expectType<Inferred>().toBe<Expected>();
        });
    });
});
