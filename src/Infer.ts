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

export type InferField<F extends Field, N extends { [key: string]: any; } = {}, M = undefined, S = undefined> =
    F extends { kind: infer K; } ? (
        K extends 'null'      ? null :
        K extends 'any'       ? any :
        K extends 'boolean'   ? boolean :
        K extends 'integer'   ? number :
        K extends 'number'    ? number :
        K extends 'string'    ? string :
        K extends 'literal'   ? F extends { of: infer O extends LiteralField['of']; } ? O : never :
        K extends 'array'     ? F extends { of: infer O extends Field; } ? InferField<O, N, M, S>[] : never :
        K extends 'record'    ? F extends { of: infer O extends Field; } ? { [key: string]: InferField<O, N, M, S>; } : never :
        K extends 'model'     ? F extends { of: infer O extends ModelField['of']; } ? InferObject<O, N> : never :
        K extends 'object'    ? F extends { of: infer O extends ObjectField['of']; } ? InferObject<O, N, M> : never :
        K extends 'union'     ? F extends { of: infer O extends UnionField['of']; } ? InferField<O[number], N, M, S> : never :
        K extends 'tuple'     ? F extends { of: infer O extends TupleField['of'], rest?: infer R extends Field | undefined; } ? InferTuple<O, N, M, S, R> : never :
        K extends 'composite' ? F extends { of: infer O extends CompositeField['of']; } ? UnionToIntersection<InferField<O[number], N, M, S>> : never :
        K extends 'ref'       ? F extends { of: infer O extends string; } ? (O extends keyof N ? (N[O] extends Field ? InferField<N[O], N, M, S> : N[O]) : never) : never :
        K extends 'this'      ? S :
        K extends 'root'      ? M :
        never
    ) : never;

export type InferObject<T extends FieldObject, N extends { [key: string]: string; } = {}, R = undefined> = {
    -readonly [K in keyof T as T[K] extends { isOptional: true; } ? never : K]: InferField<T[K], N, R extends undefined ? InferObject<T> : R, InferObject<T>>
} & {
    -readonly [K in keyof T as T[K] extends { isOptional: true; } ? K : never]?: InferField<T[K], N, R extends undefined ? InferObject<T> : R, InferObject<T>>
} & unknown;

export type InferTuple<T extends Field[], N extends { [key: string]: string; } = {}, R = undefined, S = undefined, Rest extends Field | undefined = undefined> = {
    [K in keyof T]: InferField<T[K], N, R, S>;
} extends infer U ? U extends any[] ? [...U, ...(Rest extends Field ? InferField<Rest, N, R, S>[] : [])] : never : never;

// Allows namespace to be referenced together
export type InferNamespace<T extends { [key: string]: Field; }> = { [K in keyof T]: InferField<T[K], T> };
