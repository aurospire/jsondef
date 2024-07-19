export type BaseField<Kind extends string> = { kind: Kind; } & BaseAttributes;


export type BaseAttributes = { isOptional?: boolean; description?: string; };

export type BoundedAttributes = { min?: number; max?: number; xmin?: number; xmax?: number; };

export type SizedAttributes = { length?: number; };


export type NullField = BaseField<'null'>;

export type AnyField = BaseField<'any'>;

export type BooleanField = BaseField<'boolean'>;

export type IntegerField = BaseField<'integer'> & BoundedAttributes;

export type NumberField = BaseField<'number'> & BoundedAttributes;


export type StringFieldPattern =
    | 'date'
    | 'time'
    | 'datetime'
    | 'uuid'
    | 'email'
    | 'base64'
    ;

export type StringAttributes = { format?: RegExp | StringFieldPattern; };

export type StringField = BaseField<'string'> & StringAttributes & BoundedAttributes & SizedAttributes;


export type LiteralAttributes = { of: boolean | number | string; };

export type LiteralField = BaseField<'literal'> & LiteralAttributes;


export type ArrayAttributes = { of: Field; };

export type ArrayField = BaseField<'array'> & ArrayAttributes & BoundedAttributes & SizedAttributes;


export type TupleAttributes = { of: Field[]; rest?: Field; };

export type TupleField = BaseField<'tuple'> & TupleAttributes;


export type RecordAttributes = { key?: StringField; of?: Field; };

export type RecordField = BaseField<'record'> & RecordAttributes & BoundedAttributes & SizedAttributes;


export type ModelAttributes = { name: string; of: FieldObject; };

export type ModelField = BaseField<'model'> & ModelAttributes;


export type ObjectAttributes = { of: FieldObject; };

export type ObjectField = BaseField<'object'> & ObjectAttributes;


export type CompositeAttributes = { of: (ModelField | ObjectField | RecordField)[]; };

export type CompositeField = BaseField<'composite'> & CompositeAttributes;


export type UnionAttributes = { of: [Field, Field, ...Field[]]; };

export type UnionField = BaseField<'union'> & UnionAttributes;


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