import { Combine } from "./util/Combine";
import {
    AnyField, ArrayField, BooleanField, CompositeField,
    Field, FieldObject, IntegerField, LiteralField,
    ModelField, NullField, NumberField, ObjectField,
    RecordField, RootField, StringField, ThisField,
    TupleField,
    UnionField,
} from "./Field";

export type InferField<T extends Field, R = undefined, S = undefined> =
    T extends NullField ? null :
    T extends AnyField ? any :
    T extends BooleanField ? boolean :
    T extends IntegerField ? number :
    T extends NumberField ? number :
    T extends StringField ? string :
    T extends LiteralField ? T['of'] :
    T extends ArrayField ? InferField<T['of'], R, S>[] :
    T extends TupleField ? InferTuple<T['of'], R, S, T['rest']> :
    T extends RecordField ? { [key: string]: T['of'] extends Field ? InferField<T['of'], R, S> : any; } :
    T extends ModelField ? InferObject<T['of']> :
    T extends ObjectField ? InferObject<T['of'], R> :
    T extends CompositeField ? Combine<{ [K in number]: InferField<T['of'][K], R, S> }, number> :
    T extends UnionField ? InferField<T['of'][number], R, S> :
    T extends ThisField ? S :
    T extends RootField ? R :
    never;

export type InferObject<T extends FieldObject, R = undefined> = {
    -readonly [K in keyof T as T[K] extends { optional: true; } ? never : K]: InferField<T[K], R extends undefined ? InferObject<T> : R, InferObject<T>>
} & {
    -readonly [K in keyof T as T[K] extends { optional: true; } ? K : never]?: InferField<T[K], R extends undefined ? InferObject<T> : R, InferObject<T>>
} & unknown;

export type InferTuple<T extends Field[], R = undefined, S = undefined, Rest extends Field | undefined = undefined> = {
    [K in keyof T]: InferField<T[K], R, S>;
} extends infer U ? U extends any[] ? [...U, ...(Rest extends Field ? InferField<Rest, R, S>[] : [])] : never : never;



