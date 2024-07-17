import { AnyField, ArrayField, BooleanField, CompositeField, Field, FieldObject, LiteralField, ModelField, NullField, NumericField, ObjectField, RecordField, RootField, StringField, ThisField } from "./Field";
import { Combine, OneOrMore } from "./UtilityTypes";

export type InferField<T extends OneOrMore<Field>, R = never, S = never> =
    T extends Field[] ? InferField<T[number], R, S> :
    T extends NullField ? null :
    T extends AnyField ? any :
    T extends BooleanField ? boolean :
    T extends NumericField ? number :
    T extends StringField ? string :
    T extends LiteralField ? T['of'] :
    T extends ArrayField ? InferField<T['of'], R, S>[] :
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