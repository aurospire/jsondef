/**
 * Base attributes common to all field types.
 */
export type BaseAttributes = {
    /** Indicates if the field is optional. */
    isOptional?: boolean;
    /** Provides a description of the field. */
    description?: string;
};

/**
 * Base field type with a specific kind.
 * @template Kind - The kind of field, extending string.
 */
export type BaseField<Kind extends string> = { kind: Kind; } & BaseAttributes;

/**
 * Represents a null field.
 */
export type NullField = BaseField<'null'>;

/**
 * Represents a field of any type.
 */
export type AnyField = BaseField<'any'>;

/**
 * Represents a boolean field.
 */
export type BooleanField = BaseField<'boolean'>;

/**
 * Attributes for fields with bounded values.
 */
export type BoundedAttributes = {
    /** Inclusive minimum value. */
    min?: number;
    /** Inclusive maximum value. */
    max?: number;
    /** Exclusive minimum value. */
    xmin?: number;
    /** Exclusive maximum value. */
    xmax?: number;
};

/**
 * Represents an integer field.
 */
export type IntegerField = BaseField<'integer'> & BoundedAttributes;

/**
 * Represents a number field.
 */
export type NumberField = BaseField<'number'> & BoundedAttributes;

/**
 * Represents a regex string in the format /.../...
 */
export type RegexString = `/${string}/${string}`;

/**
 * Possible string field patterns.
 */
export type StringFieldPattern =
    | 'date'
    | 'time'
    | 'datetime'
    | 'uuid'
    | 'email'
    | 'base64'
    | RegexString;

/**
 * Attributes specific to string fields.
 */
export type StringAttributes = { of?: StringFieldPattern | RegExp; };

/**
 * Represents a string field.
 */
export type StringField = BaseField<'string'> & BoundedAttributes & StringAttributes;

/**
 * Attributes for literal fields.
 */
export type LiteralAttributes = { of: boolean | number | string; };

/**
 * Represents a literal field (boolean, number, or string).
 */
export type LiteralField = BaseField<'literal'> & LiteralAttributes;

/**
 * Attributes for array fields.
 */
export type ArrayAttributes = { of: Field; };

/**
 * Represents an array field.
 */
export type ArrayField = BaseField<'array'> & BoundedAttributes & ArrayAttributes;

/**
 * Attributes for tuple fields.
 */
export type TupleAttributes = {
    /** Fixed number of elements with specified types. */
    of: Field[];
    /** Optional type for additional elements. */
    rest?: Field;
};

/**
 * Represents a tuple field.
 */
export type TupleField = BaseField<'tuple'> & BoundedAttributes & TupleAttributes;

/**
 * Attributes for record fields.
 */
export type RecordAttributes = {
    /** Optional field type for the values. */
    of?: Field;
    /** Optional string field for the keys. */
    key?: StringField;
};

/**
 * Represents a record field.
 */
export type RecordField = BaseField<'record'> & BoundedAttributes & RecordAttributes;

/**
 * Attributes for union fields.
 */
export type UnionAttributes = { of: [Field, Field, ...Field[]]; };

/**
 * Represents a union field.
 */
export type UnionField = BaseField<'union'> & UnionAttributes;

/**
 * Attributes for object fields.
 */
export type ObjectAttributes = { of: FieldObject; };

/**
 * Represents an object field.
 */
export type ObjectField = BaseField<'object'> & ObjectAttributes;

/**
 * Attributes for model fields.
 */
export type ModelAttributes = {
    /** Structure of the model. */
    of: FieldObject;
    /** Name of the model. */
    name: string;
};

/**
 * Represents a model field.
 */
export type ModelField = BaseField<'model'> & ModelAttributes;

/**
 * Attributes for group fields.
 */
export type GroupAttributes = {
    /** Field object containing the group's fields. */
    of: FieldObject;
    /** Optional selected field within the group. */
    selected?: string;
};

/**
 * Represents a group field.
 */
export type GroupField = BaseField<'group'> & GroupAttributes;

/**
 * Attributes for reference fields.
 */
export type RefAttributes = { of: string; };

/**
 * Represents a reference field.
 */
export type RefField = BaseField<'ref'> & RefAttributes;

/**
 * Represents a root field.
 */
export type RootField = BaseField<'root'>;

/**
 * Represents a this field.
 */
export type ThisField = BaseField<'this'>;

// Making Field a BaseField with certain kinds speeds up (and prevents recursion errors)
// but you cant resolve kind by type anymore :\
/**
 * Union type of all possible field types.
 */
export type Field = BaseField<
    | NullField['kind']
    | AnyField['kind']
    | BooleanField['kind']
    | IntegerField['kind']
    | NumberField['kind']
    | StringField['kind']
    | LiteralField['kind']
    | ArrayField['kind']
    | TupleField['kind']
    | RecordField['kind']
    | UnionField['kind']
    | ObjectField['kind']
    | ModelField['kind']
    | GroupField['kind']
    | RefField['kind']
    | RootField['kind']
    | ThisField['kind']
>;

/**
 * Represents an object containing fields.
 */
export type FieldObject = { [key: string]: Field; };
