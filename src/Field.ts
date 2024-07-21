export type BaseField<Kind extends string> = { kind: Kind; } & BaseAttributes;


export type BaseAttributes = { isOptional?: boolean; description?: string; };


export type NullField = BaseField<'null'>;

export type AnyField = BaseField<'any'>;

export type ThisField = BaseField<'this'>;

export type RootField = BaseField<'root'>;

export type BooleanField = BaseField<'boolean'>;


export type BoundedAttributes = { min?: number; max?: number; xmin?: number; xmax?: number; };

export type IntegerField = BaseField<'integer'> & BoundedAttributes;

export type NumberField = BaseField<'number'> & BoundedAttributes;


export type StringFieldPattern =
    | 'date'
    | 'time'
    | 'datetime'
    | 'uuid'
    | 'email'
    | 'base64'
    | `/${string}/${string}/` // Regex Pattern
    ;

export type StringAttributes = { of?: RegExp | StringFieldPattern; };

export type StringField = BaseField<'string'> & BoundedAttributes & StringAttributes;


export type LiteralAttributes = { of: boolean | number | string; };

export type LiteralField = BaseField<'literal'> & LiteralAttributes;


export type ArrayAttributes = { of: Field; };

export type ArrayField = BaseField<'array'> & BoundedAttributes & ArrayAttributes;


export type TupleAttributes = { of: Field[]; rest?: Field; };

export type TupleField = BaseField<'tuple'> & BoundedAttributes & TupleAttributes;


export type RecordAttributes = { of?: Field; key?: StringField; };

export type RecordField = BaseField<'record'> & BoundedAttributes & RecordAttributes;


export type ModelAttributes = { of: FieldObject; name: string; };

export type ModelField = BaseField<'model'> & ModelAttributes;


export type ObjectAttributes = { of: FieldObject; };

export type ObjectField = BaseField<'object'> & ObjectAttributes;


export type CompositeAttributes = { of: (ModelField | ObjectField | RecordField)[]; };

export type CompositeField = BaseField<'composite'> & CompositeAttributes;


export type UnionAttributes = { of: [Field, Field, ...Field[]]; };

export type UnionField = BaseField<'union'> & UnionAttributes;


export type RefAttributes = { of: string; };

export type RefField = BaseField<'ref'> & RefAttributes;


export type Field =
    | NullField
    | AnyField
    | ThisField
    | RootField
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

    | RefField
    ;

export type FieldObject = { [key: string]: Field; };