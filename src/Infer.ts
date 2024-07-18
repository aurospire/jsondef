import {
    AnyField, ArrayField, BooleanField, CompositeField,
    Field, FieldObject, IntegerField, LiteralField,
    ModelField, NullField, NumberField, ObjectField,
    RecordField, RootField, StringField, ThisField,
    TupleField,
} from "./Field";
import { Combine, OneOrMore } from "./UtilityTypes";

export type InferField<T extends OneOrMore<Field>, R = undefined, S = undefined> =
    T extends Field[] ? InferField<T[number], R, S> :
    T extends NullField ? null :
    T extends AnyField ? any :
    T extends BooleanField ? boolean :
    T extends IntegerField ? number :
    T extends NumberField ? number :
    T extends StringField ? string :
    T extends LiteralField ? T['of'] :
    T extends ArrayField ? InferField<T['of'], R, S>[] :
    T extends TupleField ? InferTuple<T['of'], R, S, T['rest']> :
    T extends RecordField ? { [key: string]: T['value'] extends Field ? InferField<T['value'], R, S> : any; } :
    T extends ModelField ? InferObject<T['of']> :
    T extends ObjectField ? InferObject<T['of'], R> :
    T extends CompositeField ? Combine<{ [K in number]: InferField<T['of'][K], R, S> }, number> :
    T extends ThisField ? S :
    T extends RootField ? R :
    never;

type InferObject<T extends FieldObject, R = undefined> = {
    -readonly [K in keyof T as T[K] extends { optional: true; } ? never : K]: InferField<T[K], R extends undefined ? InferObject<T> : R, InferObject<T>>
} & {
    -readonly [K in keyof T as T[K] extends { optional: true; } ? K : never]?: InferField<T[K], R extends undefined ? InferObject<T> : R, InferObject<T>>
} & unknown;

type InferTuple<T extends Field[], R = undefined, S = undefined, Rest extends Field | undefined = undefined> = {
    [K in keyof T]: InferField<T[K], R, S>;
} extends infer U ? U extends any[] ? [...U, ...(Rest extends Field ? InferField<Rest, R, S>[] : [])] : never : never;

