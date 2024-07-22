import {
    CompositeField,
    Field, FieldObject,
    LiteralField,
    ModelField,
    ObjectField,
    TupleField,
    UnionField
} from "./Field";
import { UnionToIntersection } from "./util";

/**
 * Infers a TypeScript type from a given field type definition.
 * This type utility processes different `Field` kinds and converts them into corresponding TypeScript types.
 * 
 * @template F - The field type extending the generic Field type.
 * @template N - An optional namespace object with keys to referenceable fields, usable with 'ref' kind fields.
 * @template M - An optional type parameter for the root-reference, usable with 'root' kind fields.
 * @template S - An optional type parameter for self-reference, usable with 'this' kind fields.
 * @returns The TypeScript type inferred from the field type definition.
 */
export type InferField<F extends Field, N extends { [key: string]: any; } = {}, M = undefined, S = undefined> =
    F extends { kind: infer K; } ? (
        K extends 'null' ? null :
        K extends 'any' ? any :
        K extends 'boolean' ? boolean :
        K extends 'integer' ? number :
        K extends 'number' ? number :
        K extends 'string' ? string :
        K extends 'literal' ? F extends { of: infer O extends LiteralField['of']; } ? O : never :
        K extends 'array' ? F extends { of: infer O extends Field; } ? InferField<O, N, M, S>[] : never :
        K extends 'record' ? F extends { of: infer O extends Field; } ? { [key: string]: InferField<O, N, M, S>; } : never :
        K extends 'model' ? F extends { of: infer O extends ModelField['of']; } ? InferObject<O, N> : never :
        K extends 'object' ? F extends { of: infer O extends ObjectField['of']; } ? InferObject<O, N, M> : never :
        K extends 'union' ? F extends { of: infer O extends UnionField['of']; } ? InferField<O[number], N, M, S> : never :
        K extends 'tuple' ? F extends { of: infer O extends TupleField['of'], rest?: infer R extends Field | undefined; } ? InferTuple<O, N, M, S, R> : never :
        K extends 'composite' ? F extends { of: infer O extends CompositeField['of']; } ? UnionToIntersection<InferField<O[number], N, M, S>> : never :
        K extends 'ref' ? F extends { of: infer O extends string; } ? (O extends keyof N ? (N[O] extends Field ? InferField<N[O], N, M, S> : N[O]) : never) : never :
        K extends 'this' ? S :
        K extends 'root' ? M :
        never
    ) : never;

/**
 * Converts a FieldObject containing field definitions into a TypeScript type object.
 * This function ensures that properties marked as optional in the field definitions are also optional in the inferred TypeScript type.
 *
 * @template F - FieldObject containing field definitions.
 * @template N - An optional namespace for additional type context.
 * @template M - An optional root type, providing context when 'root' kind fields are used.
 * @returns A TypeScript object type, with properties inferred from the field definitions.
 */
export type InferObject<F extends FieldObject, N extends { [key: string]: string; } = {}, M = undefined> = {
    -readonly [K in keyof F as F[K] extends { isOptional: true; } ? never : K]: InferField<F[K], N, M extends undefined ? InferObject<F> : M, InferObject<F>>
} & {
    -readonly [K in keyof F as F[K] extends { isOptional: true; } ? K : never]?: InferField<F[K], N, M extends undefined ? InferObject<F> : M, InferObject<F>>
} & unknown;

/**
 * Infers TypeScript tuple types from an array of `Field` definitions, potentially including a rest parameter.
 * This utility handles tuples by inferring types for each specified field and optionally extends the tuple with additional types if a 'rest' field is defined.
 *
 * @template F - Array of Field types defining each element of the tuple.
 * @template N - Namespace providing additional context for type inference.
 * @template M - Root type context, especially relevant for nested field structures.
 * @template S - Self-reference type, applicable in recursive type structures.
 * @template Rest - An optional Field type for additional tuple elements beyond the explicitly defined types in T.
 * @returns A TypeScript tuple type corresponding to the provided field definitions.
 */
export type InferTuple<F extends Field[], N extends { [key: string]: string; } = {}, M = undefined, S = undefined, Rest extends Field | undefined = undefined> = {
    [K in keyof F]: InferField<F[K], N, M, S>;
} extends infer U ? U extends any[] ? [...U, ...(Rest extends Field ? InferField<Rest, N, M, S>[] : [])] : never : never;

/**
 * Creates a TypeScript type representing a namespace where each field name is mapped to its inferred type.
 * This utility is useful for processing entire collections of fields at once, providing a concise and type-safe way to handle groups of related fields.
 *
 * @template N - An object with fields as properties, where each key is a field name and each value is a Field type.
 * @returns An object type with properties corresponding to the namespace's fields, each typed according to its definition.
 */
export type InferNamespace<N extends { [key: string]: Field; }> = { [K in keyof N]: InferField<N[K], N> };
