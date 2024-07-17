import { OneOrMore } from "./OneOrMore";


export type BaseField<Kind extends string> = { kind: Kind; optional: boolean; };

export type BoundedField = { min?: number; max?: number; xmin?: number; xmax?: number; };

export type SizedField = { length?: number; };

export type NullField = BaseField<'null'>;

export type AnyField = BaseField<'any'>;

export type BooleanField = BaseField<'boolean'>;

export type NumericField = BaseField<'integer' | 'number'> & BoundedField;

export type StringFieldPattern = 'date' |
    'time' |
    'datetime' |
    'uuid' |
    'email' |
    'base64';

export type StringField = BaseField<'string'> & {
    format?: RegExp | StringFieldPattern;
} & BoundedField & SizedField;

export type LiteralField = BaseField<'literal'> & {
    of: boolean | number | string;
};

export type ArrayField = BaseField<'array'> & {
    of: OneOrMore<Field>;
} & BoundedField & SizedField;


export type RecordField = BaseField<'record'> & {
    key?: StringField;
    value?: Field;
} & BoundedField & SizedField;

export type ModelField = BaseField<'model'> & {
    of: FieldObject;
};

export type ObjectField = BaseField<'object'> & {
    of: FieldObject;
};

export type ThisField = BaseField<'this'>;

export type RootField = BaseField<'root'>;


export type Field =
    | NullField
    | AnyField
    | BooleanField
    | NumericField
    | StringField
    | LiteralField
    | ArrayField
    | RecordField
    | ModelField
    | ObjectField
    | ThisField
    | RootField
    ;


export type FieldObject = { [key: string]: OneOrMore<Field>; };
