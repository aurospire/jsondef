export type BaseField<Kind extends string> = { kind: Kind; optional?: boolean; description?: string; };

export type BoundedField = { min?: number; max?: number; xmin?: number; xmax?: number; };

export type SizedField = { length?: number; };

export type NullField = BaseField<'null'>;

export type AnyField = BaseField<'any'>;

export type BooleanField = BaseField<'boolean'>;

export type IntegerField = BaseField<'integer'> & BoundedField;

export type NumberField = BaseField<'number'> & BoundedField;

export type StringFieldPattern =
    | 'date'
    | 'time'
    | 'datetime'
    | 'uuid'
    | 'email'
    | 'base64'
    ;

export type StringField = BaseField<'string'> & {
    format?: RegExp | StringFieldPattern;
} & BoundedField & SizedField;

export type LiteralField = BaseField<'literal'> & {
    of: boolean | number | string;
};

export type ArrayField = BaseField<'array'> & {
    of: Field;
} & BoundedField & SizedField;

export type TupleField = BaseField<'tuple'> & {
    of: (Field & { name?: string; })[];
    rest?: Field & { name?: string; };
};

export type RecordField = BaseField<'record'> & {
    key?: StringField;
    of?: Field;
} & BoundedField & SizedField;

export type ModelField = BaseField<'model'> & {
    name: string;
    of: FieldObject;
};

export type ObjectField = BaseField<'object'> & {
    of: FieldObject;
};

export type CompositeField = BaseField<'composite'> & {
    of: (ModelField | ObjectField | RecordField)[];
};

export type UnionField = BaseField<'union'> & { of: [Field, Field, ...Field[]]; };

export type ThisField = BaseField<'this'>;

export type RootField = BaseField<'root'>;


export type Field =
    | NullField
    | AnyField
    | BooleanField
    | IntegerField
    | NumberField
    | StringField
    | LiteralField
    | ArrayField
    | TupleField
    | RecordField
    | ModelField
    | ObjectField
    | CompositeField
    | UnionField
    | ThisField
    | RootField
    ;

export type FieldObject = { [key: string]: Field; };