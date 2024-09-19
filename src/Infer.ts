import {
    Schema, SchemaObject,
    LiteralSchema,
    ModelSchema,
    GroupSchema,
    ObjectSchema,
    TupleSchema,
    UnionSchema,
    ArraySchema
} from "./Schema";

/**
 * Infers a TypeScript type from a given schema type definition.
 * 
 * @template F - The schema type extending the generic Schema type.
 * @template G - A SchemaObject representing the global scope, containing all referenceable schemas.
 * @template R - The root scope, representing the top-level structure.
 * @template L - The local scope, representing the immediate context.
 * 
 * @returns The TypeScript type inferred from the schema type definition.
 */
export type InferSchema<F extends Schema, G extends SchemaObject = {}, R = undefined, L = undefined> =
    F extends { kind: infer K; } ? (
        K extends 'null'        ? null :
        K extends 'any'         ? any :
        K extends 'boolean'     ? boolean :
        K extends 'integer'     ? number :
        K extends 'number'      ? number :
        K extends 'string'      ? string :
        K extends 'literal'     ? F extends { of: infer O extends LiteralSchema['of']; } ? O : never :
        K extends 'array'       ? F extends { of: infer O extends Schema; } ? Array<InferSchema<O, G, R, L>> : never :
        K extends 'tuple'       ? F extends { of: infer O extends TupleSchema['of']; } ? (F extends { rest: infer R extends ArraySchema; } ? InferTuple<O, G, R, L, R['of']> : InferTuple<O, G, R, L> ): never :
        K extends 'record'      ? F extends { of: infer O extends Schema; } ? { [key: string]: InferSchema<O, G, R, L>; } : never :
        K extends 'union'       ? F extends { of: infer O extends UnionSchema['of']; } ? InferSchema<O[number], G, R, L> : never :
        K extends 'object'      ? F extends { of: infer O extends ObjectSchema['of']; } ? InferObject<O, G, R> : never :
        K extends 'model'       ? F extends { of: infer O extends ModelSchema['of']; } ? InferObject<O, G> : never :
        K extends 'group'       ? F extends { of: infer O extends GroupSchema['of']; } ? (F extends { selected: infer S extends string } ? InferSchema<O[S], O> : InferGlobal<O> ): never :
        K extends 'ref'         ? F extends { of: infer O extends string; } ? (O extends keyof G ? (G[O] extends Schema ? InferSchema<G[O], G, R, L> : G[O]) : never) : never :
        K extends 'root'        ? R extends undefined ? never : R :
        K extends 'this'        ? L extends undefined ? never : L :
        never
    ) : never;

/**
 * Infers a TypeScript object type from a SchemaObject definition.
 * 
 * @template F - The SchemaObject to infer from.
 * @template G - A SchemaObject representing the global scope.
 * @template R - The root scope, representing the top-level structure.
 * 
 * @returns An object type with required and optional properties based on the SchemaObject definition.
 */
export type InferObject<F extends SchemaObject, G extends SchemaObject = {}, R = undefined> = {
    -readonly [K in keyof F as F[K] extends { isOptional: true; } ? never : K]: InferSchema<F[K], G, R extends undefined ? InferObject<F> : R, InferObject<F>>
} & {
    -readonly [K in keyof F as F[K] extends { isOptional: true; } ? K : never]?: InferSchema<F[K], G, R extends undefined ? InferObject<F> : R, InferObject<F>>
} & unknown;

/**
 * Infers a TypeScript tuple type from an array of Schema definitions.
 * 
 * @template F - An array of Schema types representing the tuple elements.
 * @template G - A SchemaObject representing the global scope.
 * @template M - The model scope.
 * @template L - The local scope.
 * @template R - An optional rest Schema type for additional elements.
 * 
 * @returns A tuple type based on the input Schema array and optional rest type.
 */
export type InferTuple<F extends Schema[], G extends SchemaObject = {}, M = undefined, L = undefined, R extends Schema | undefined = undefined> = {
    [K in keyof F]: InferSchema<F[K], G, M, L>;
} extends infer U ? U extends any[] ? [...U, ...(R extends Schema ? InferSchema<R, G, M, L>[] : [])] : never : never;

/**
 * Infers a global object type from a SchemaObject, where each property is inferred using InferSchema.
 * 
 * @template G - A SchemaObject representing the global scope.
 * 
 * @returns An object type where each property is inferred from the corresponding Schema in the input SchemaObject.
 */
export type InferGlobal<G extends SchemaObject> = { -readonly [K in keyof G]: InferSchema<G[K], G> };