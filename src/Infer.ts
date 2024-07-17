import { AnyField, ArrayField, BooleanField, Field, FieldObject, LiteralField, ModelField, NullField, NumericField, ObjectField, RecordField, StringField } from "./Field";
import { OneOrMore } from "./OneOrMore";

export type InferField<T extends OneOrMore<Field>, R, S> =
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
    never;

export type InferObject<T extends FieldObject, R = undefined> = {
    -readonly [K in keyof T]: InferField<T[K], R extends undefined ? InferObject<T> : R, InferObject<T>>
} & unknown;