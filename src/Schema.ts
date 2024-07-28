/**
 * Base attributes common to all schema types.
 */
export type BaseAttributes = { description?: string; isOptional?: boolean; };

/**
 * Base schema type with a specific kind.
 * @template Kind - The kind of schema, extending string.
 */
export type BaseSchema<Kind extends string> = { kind: Kind; } & BaseAttributes;

/**
 * Represents a null schema.
 */
export type NullSchema = BaseSchema<'null'>;

/**
 * Represents a schema of any type.
 */
export type AnySchema = BaseSchema<'any'>;

/**
 * Represents a boolean schema.
 */
export type BooleanSchema = BaseSchema<'boolean'>;

/**
 * Attributes for schemas with bounded values.
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
 * Represents an integer schema.
 */
export type IntegerSchema = BaseSchema<'integer'> & BoundedAttributes;

/**
 * Represents a number schema.
 */
export type NumberSchema = BaseSchema<'number'> & BoundedAttributes;

/**
 * Represents a regex string in the format /pattern/flags?
 */
export type RegexString = `/${string}/${string}`;

/**
 * Possible string schema patterns.
 */
export type StringSchemaPattern =
    | 'date'
    | 'time'
    | 'datetime'
    | 'uuid'
    | 'email'
    | 'base64'
    | RegexString;

/**
 * Attributes specific to string schemas.
 */
export type StringAttributes = { of?: StringSchemaPattern | RegExp; };

/**
 * Represents a string schema.
 */
export type StringSchema = BaseSchema<'string'> & BoundedAttributes & StringAttributes;

/**
 * Attributes for literal schemas.
 */
export type LiteralAttributes = { of: boolean | number | string; };

/**
 * Represents a literal schema (boolean, number, or string).
 */
export type LiteralSchema = BaseSchema<'literal'> & LiteralAttributes;

/**
 * Attributes for array schemas.
 */
export type ArrayAttributes = { of: Schema; };

/**
 * Represents an array schema.
 */
export type ArraySchema = BaseSchema<'array'> & BoundedAttributes & ArrayAttributes;

/**
 * Attributes for tuple schemas.
 */
export type TupleAttributes = { of: Schema[]; rest?: ArraySchema; };

/**
 * Represents a tuple schema.
 */
export type TupleSchema = BaseSchema<'tuple'> & TupleAttributes;

/**
 * Attributes for record schemas.
 */
export type RecordAttributes = { of: Schema; key?: StringSchema; };

/**
 * Represents a record schema.
 */
export type RecordSchema = BaseSchema<'record'> & BoundedAttributes & RecordAttributes;

/**
 * Attributes for union schemas.
 */
export type UnionAttributes = { of: [Schema, Schema, ...Schema[]]; };

/**
 * Represents a union schema.
 */
export type UnionSchema = BaseSchema<'union'> & UnionAttributes;

/**
 * Attributes for object schemas.
 */
export type ObjectAttributes = { of: SchemaObject; };

/**
 * Represents an object schema.
 */
export type ObjectSchema = BaseSchema<'object'> & ObjectAttributes;

/**
 * Attributes for model schemas.
 */
export type ModelAttributes = { of: SchemaObject; };

/**
 * Represents a model schema.
 */
export type ModelSchema = BaseSchema<'model'> & ModelAttributes;

/**
 * Attributes for group schemas.
 */
export type GroupAttributes = { of: SchemaObject; selected?: string; };

/**
 * Represents a group schema.
 */
export type GroupSchema = BaseSchema<'group'> & GroupAttributes;

/**
 * Attributes for reference schemas.
 */
export type RefAttributes = { of: string; };

/**
 * Represents a reference schema.
 */
export type RefSchema = BaseSchema<'ref'> & RefAttributes;

/**
 * Represents a root schema.
 */
export type RootSchema = BaseSchema<'root'>;

/**
 * Represents a this schema.
 */
export type ThisSchema = BaseSchema<'this'>;

// Making Schema a BaseSchema with certain kinds speeds up (and prevents recursion errors)
// but you cant resolve type by kind anymore :\
/**
 * Union type of all possible schema types.
 */
export type Schema = BaseSchema<
    | NullSchema['kind']
    | AnySchema['kind']
    | BooleanSchema['kind']
    | IntegerSchema['kind']
    | NumberSchema['kind']
    | StringSchema['kind']
    | LiteralSchema['kind']
    | ArraySchema['kind']
    | TupleSchema['kind']
    | RecordSchema['kind']
    | UnionSchema['kind']
    | ObjectSchema['kind']
    | ModelSchema['kind']
    | GroupSchema['kind']
    | RefSchema['kind']
    | RootSchema['kind']
    | ThisSchema['kind']
>;

/**
 * Represents an object containing schemas.
 */
export type SchemaObject = { [key: string]: Schema; };
