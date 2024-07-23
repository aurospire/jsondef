/**
 * Defines the base attributes that can be applied to any field.
 */
export type BaseAttributes = {
    isOptional?: boolean;  // Indicates if the field is optional.
    description?: string;  // Provides a description of the field.
};

/**
 * Represents a basic field with a specific kind.
 * @template Kind The specific kind of the field.
 */
export type BaseField<Kind extends string> = { kind: Kind; } & BaseAttributes;

/**
 * Represents a field of type 'null'.
 */
export type NullField = BaseField<'null'>;

/**
 * Represents a field of type 'any'.
 */
export type AnyField = BaseField<'any'>;

/**
 * Represents a field referring to 'this' context. 'This' refers to the current object or model scope.
 */
export type ThisField = BaseField<'this'>;

/**
 * Represents a root field type. 'Root' refers to the most recent model or the top-level object.
 */
export type RootField = BaseField<'root'>;

/**
 * Represents a boolean field type.
 */
export type BooleanField = BaseField<'boolean'>;

/**
 * Defines attributes for bounded fields, specifying optional minimum and maximum values, including exclusive bounds.
 */
export type BoundedAttributes = {
    min?: number;  // Inclusive minimum value.
    max?: number;  // Inclusive maximum value.
    xmin?: number; // Exclusive minimum value.
    xmax?: number; // Exclusive maximum value.
};

/**
 * Represents an integer field with optional bounded attributes.
 */
export type IntegerField = BaseField<'integer'> & BoundedAttributes;

/**
 * Represents a numeric field with optional bounded attributes.
 */
export type NumberField = BaseField<'number'> & BoundedAttributes;

/**
 * Represents a string pattern using a regex format.
 */
export type RegexString = `/${string}/${string}`;

/**
 * Defines patterns that a string field can match.
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
 * Defines attributes for string fields, including patterns they can match.
 */
export type StringAttributes = { of?: StringFieldPattern | RegExp; };

/**
 * Represents a string field with optional bounded and string-specific attributes.
 */
export type StringField = BaseField<'string'> & BoundedAttributes & StringAttributes;


/**
 * Defines attributes for literal fields specifying the exact value.
 */
export type LiteralAttributes = { of: boolean | number | string; };

/**
 * Represents a literal field with specific value attributes.
 */
export type LiteralField = BaseField<'literal'> & LiteralAttributes;


/**
 * Defines attributes for array fields specifying the type of elements.
 */
export type ArrayAttributes = { of: Field; };

/**
 * Represents an array field with optional bounded attributes and element type specification.
 */
export type ArrayField = BaseField<'array'> & BoundedAttributes & ArrayAttributes;


/**
 * Defines attributes for tuple fields including types of elements and optional rest type.
 */
export type TupleAttributes = {
    of: Field[];   // Fixed number of elements with specified types.
    rest?: Field;  // Optional type for additional elements.
};

/**
 * Represents a tuple field with optional bounded attributes and specific element types.
 */
export type TupleField = BaseField<'tuple'> & BoundedAttributes & TupleAttributes;


/**
 * Defines attributes for record fields including optional field type for values and key type.
 */
export type RecordAttributes = {
    of?: Field;        // Optional field type for the values.
    key?: StringField; // Optional string field for the keys.
};

/**
 * Represents a record field with optional bounded attributes and key-value specifications.
 */
export type RecordField = BaseField<'record'> & BoundedAttributes & RecordAttributes;


/**
 * Defines attributes for model fields including the structure and name.
 */
export type ModelAttributes = {
    of: FieldObject; // Structure of the model.
    name: string;    // Name of the model.
};

/**
 * Represents a model field with specific model attributes.
 */
export type ModelField = BaseField<'model'> & ModelAttributes;


/**
 * Defines attributes for object fields specifying the structure.
 */
export type ObjectAttributes = { of: FieldObject; };

/**
 * Represents an object field with specific structure attributes.
 */
export type ObjectField = BaseField<'object'> & ObjectAttributes;


/**
 * Defines attributes for composite fields combining multiple model, object, or record fields.
 */
export type CompositeAttributes = { of: (ModelField | ObjectField | RecordField)[]; };

/**
 * Represents a composite field with specific composition attributes.
 */
export type CompositeField = BaseField<'composite'> & CompositeAttributes;


/**
 * Defines attributes for union fields specifying multiple possible types.
 */
export type UnionAttributes = { of: [Field, Field, ...Field[]]; };

/**
 * Represents a union field with specific union attributes.
 */
export type UnionField = BaseField<'union'> & UnionAttributes;


/**
 * Defines attributes for namespace fields specifying the structure.
 */
export type NamespaceAttributes = { of: FieldObject; };

/**
 * Represents a namespace field with specific structure attributes.
 */
export type NamespaceField = BaseField<'namespace'> & NamespaceAttributes;


/**
 * Defines attributes for reference fields specifying a reference by name. 'Ref' refers to another type in a Field namespace.
 */
export type RefAttributes = { of: string; };

/**
 * Represents a reference field with a string reference.
 */
export type RefField = BaseField<'ref'> & RefAttributes;


/**
 * Union type of all possible field types.
 */
export type Field = BaseField<string> // How much should this speed it up?
    // | NullField
    // | AnyField
    // | ThisField
    // | RootField
    // | BooleanField
    // | IntegerField
    // | NumberField
    // | StringField
    // | LiteralField
    // | ArrayField
    // | TupleField
    // | RecordField
    // | ModelField
    // | ObjectField
    // | CompositeField
    // | UnionField
    // | RefField
    // | NamespaceField;

/**
 * Represents an object where each key is associated with a specific field type.
 */
export type FieldObject = { [key: string]: Field; };
