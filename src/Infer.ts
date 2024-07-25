import {
    Field, FieldObject,
    LiteralField,
    ModelField,
    GroupField,
    ObjectField,
    TupleField,
    UnionField
} from "./Field";

/**
 * Infers a TypeScript type from a given field type definition.
 * 
 * @template F - The field type extending the generic Field type.
 * @template G - A FieldObject representing the global scope, containing all referenceable fields.
 * @template R - The root scope, representing the top-level structure.
 * @template L - The local scope, representing the immediate context.
 * 
 * @returns The TypeScript type inferred from the field type definition.
 */
export type InferField<F extends Field, G extends FieldObject = {}, R = undefined, L = undefined> =
    F extends { kind: infer K; } ? (
        K extends 'null'        ? null :
        K extends 'any'         ? any :
        K extends 'boolean'     ? boolean :
        K extends 'integer'     ? number :
        K extends 'number'      ? number :
        K extends 'string'      ? string :
        K extends 'literal'     ? F extends { of: infer O extends LiteralField['of']; } ? O : never :
        K extends 'array'       ? F extends { of: infer O extends Field; } ? Array<InferField<O, G, R, L>> : never :
        K extends 'tuple'       ? F extends { of: infer O extends TupleField['of']; } ? (F extends { rest: infer R extends Field; } ? InferTuple<O, G, R, L, R> : InferTuple<O, G, R, L> ): never :
        K extends 'record'      ? F extends { of: infer O extends Field; } ? { [key: string]: InferField<O, G, R, L>; } : { [key: string]: any; } :
        K extends 'union'       ? F extends { of: infer O extends UnionField['of']; } ? InferField<O[number], G, R, L> : never :
        K extends 'object'      ? F extends { of: infer O extends ObjectField['of']; } ? InferObject<O, G, R> : never :
        K extends 'model'       ? F extends { of: infer O extends ModelField['of']; } ? InferObject<O, G> : never :
        K extends 'group'       ? F extends { of: infer O extends GroupField['of']; } ? (F extends { selected: infer S extends string } ? InferField<O[S], O> : InferGlobal<O> ): never :
        K extends 'ref'         ? F extends { of: infer O extends string; } ? (O extends keyof G ? (G[O] extends Field ? InferField<G[O], G, R, L> : G[O]) : never) : never :
        K extends 'root'        ? R extends undefined ? never : R :
        K extends 'this'        ? L extends undefined ? never : L :
        never
    ) : never;

/**
 * Infers a TypeScript object type from a FieldObject definition.
 * 
 * @template F - The FieldObject to infer from.
 * @template G - A FieldObject representing the global scope.
 * @template R - The root scope, representing the top-level structure.
 * 
 * @returns An object type with required and optional properties based on the FieldObject definition.
 */
export type InferObject<F extends FieldObject, G extends FieldObject = {}, R = undefined> = {
    -readonly [K in keyof F as F[K] extends { isOptional: true; } ? never : K]: InferField<F[K], G, R extends undefined ? InferObject<F> : R, InferObject<F>>
} & {
    -readonly [K in keyof F as F[K] extends { isOptional: true; } ? K : never]?: InferField<F[K], G, R extends undefined ? InferObject<F> : R, InferObject<F>>
} & unknown;

/**
 * Infers a TypeScript tuple type from an array of Field definitions.
 * 
 * @template F - An array of Field types representing the tuple elements.
 * @template G - A FieldObject representing the global scope.
 * @template M - The model scope.
 * @template L - The local scope.
 * @template R - An optional rest Field type for additional elements.
 * 
 * @returns A tuple type based on the input Field array and optional rest type.
 */
export type InferTuple<F extends Field[], G extends FieldObject = {}, M = undefined, L = undefined, R extends Field | undefined = undefined> = {
    [K in keyof F]: InferField<F[K], G, M, L>;
} extends infer U ? U extends any[] ? [...U, ...(R extends Field ? InferField<R, G, M, L>[] : [])] : never : never;

/**
 * Infers a global object type from a FieldObject, where each property is inferred using InferField.
 * 
 * @template G - A FieldObject representing the global scope.
 * 
 * @returns An object type where each property is inferred from the corresponding Field in the input FieldObject.
 */
export type InferGlobal<G extends FieldObject> = { [K in keyof G]: InferField<G[K], G> };