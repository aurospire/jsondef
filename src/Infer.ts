import { Combine } from "./util/Combine";
import {
    AnyField, ArrayField, BooleanField, CompositeField,
    Field, FieldObject, IntegerField, LiteralField,
    ModelField, NullField, NumberField, ObjectField,
    RecordField, RefField, RootField, StringField, ThisField,
    TupleField,
    UnionField,
} from "./Field";

export type InferField<T extends Field, N extends { [key: string]: any; } = {}, R = undefined, S = undefined> =
    T extends NullField ? null :
    T extends AnyField ? any :
    // Returns current Scope (S - most recent Object/Model or root Object/Model)
    T extends ThisField ? S :
    // Returns root Scope (R - most recent Model)
    T extends RootField ? R :
    T extends BooleanField ? boolean :
    T extends IntegerField ? number :
    T extends NumberField ? number :
    T extends StringField ? string :
    T extends LiteralField ? T['of'] :
    T extends ArrayField ? InferField<T['of'], N, R, S>[] :
    T extends TupleField ? InferTuple<T['of'], N, R, S, T['rest']> :
    T extends RecordField ? { [key: string]: T['of'] extends Field ? InferField<T['of'], N, R, S> : any; } :
    T extends ModelField ? InferObject<T['of'], N> :
    T extends ObjectField ? InferObject<T['of'], N, R> :
    T extends CompositeField ? Combine<{ [K in number]: InferField<T['of'][K], N, R, S> }, number> :
    T extends UnionField ? InferField<T['of'][number], N, R, S> :
    // Returns type referenced in N (namespace)
    T extends RefField ? T['of'] extends keyof N ? N[T['of']] extends Field ? InferField<N[T['of']], N, R, S> : N[T['of']] : never :
    never;

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
