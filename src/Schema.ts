import { RegexString } from "./util/RegexString";

/** Base attributes that can be applied to any schema. */
export type BaseAttributes = {
    /** Indicates whether the schema is optional when in an Object/Model. */
    isOptional?: boolean;

    /** TODO: Optional description of the schema. */
    description?: string;
};

export type BaseSchema<Kind extends string> = { /** The kind of schema. */ kind: Kind; } & BaseAttributes;

/** Represents a schema for a `null` value. */
export type NullSchema = BaseSchema<'null'>;

/** Represents a schema for any valid JSON value. */
export type AnySchema = BaseSchema<'any'>;

/** Represents a schema for a boolean value. */
export type BooleanSchema = BaseSchema<'boolean'>;


/** Attributes that define bounds for numeric schemas. */
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

/** Represents a schema for an integer value with optional bounds. */
export type IntegerSchema = BaseSchema<'integer'> & BoundedAttributes;

/** Represents a schema for a number value with optional bounds. */
export type NumberSchema = BaseSchema<'number'> & BoundedAttributes;


/** Attributes that define size constraints for schemas. */
export type SizedAttributes = BoundedAttributes & { /** Exact value. */ exact?: number; };

/** Possible formats for a string schema (Same as JSON Schema string format). */
export type StringFormat =
    | 'date'
    | 'time'
    | 'datetime'
    | 'uuid'
    | 'email'
    | 'base64'
    ;

/** Attributes that define the format or pattern for a string schema. */
export type StringAttributes = { /** Defines the format or pattern of the string. */ of?: StringFormat | RegexString | RegExp; };

/** Represents a schema for a string value with optional size and format constraints. */
export type StringSchema = BaseSchema<'string'> & SizedAttributes & StringAttributes;


/** Attributes for a literal schema, defining a specific value. */
export type LiteralAttributes = { /** The literal value that the schema represents. */ of: boolean | number | string; };

/** Represents a schema for a literal value. */
export type LiteralSchema = BaseSchema<'literal'> & LiteralAttributes;


/** Attributes for an array schema, defining the type of elements it contains. */
export type ArrayAttributes = { /** The schema of the elements in the array. */ of: Schema; };

/** Attributes for an array schema, defining the type of elements it contains. */
export type ArraySchema = BaseSchema<'array'> & SizedAttributes & ArrayAttributes;


/**  Attributes for a tuple schema, defining the types of elements and optional rest elements. */
export type TupleAttributes = {
    /** The schemas of the elements in the tuple. */
    of: Schema[];
    /** An optional schema for additional elements beyond the fixed tuple. */
    rest?: ArraySchema;
};

/** Represents a schema for a tuple with fixed and optional additional elements. */
export type TupleSchema = BaseSchema<'tuple'> & TupleAttributes;


/** Attributes for a record schema, defining the key and value types. */
export type RecordAttributes = {
    /** The schema of the values in the record. */
    of: Schema;
    /** An optional string schema for the keys in the record. */
    key?: StringSchema;
};

/** Represents a schema for a record with optional size constraints and key/value types. */
export type RecordSchema = BaseSchema<'record'> & SizedAttributes & RecordAttributes;


/** Attributes for a union schema, defining the possible schemas it can be. */
export type UnionAttributes = { /** An array of schemas representing the union types. */ of: Schema[]; };

/** Represents a schema for a union of different schemas. */
export type UnionSchema = BaseSchema<'union'> & UnionAttributes;


/** Attributes for an object schema, defining the properties of the object. */
export type ObjectAttributes = { /** The schema object defining the properties of the object. */ of: SchemaObject; };

/** 
 * Represents a schema for an object with specific properties.
 * Sets the `local` scope, or `root` scope if top level.
 */
export type ObjectSchema = BaseSchema<'object'> & ObjectAttributes;

/** Attributes for a model schema, defining the properties of the model. */
export type ModelAttributes = { /** The schema object defining the properties of the model. */ of: SchemaObject; };

/** 
 * Represents a schema for a model with specific properties. 
 * Sets the `local` scope and `root` scope.
 */
export type ModelSchema = BaseSchema<'model'> & ModelAttributes;


/** Attributes for a group schema, defining the properties of the group and the selected property. */
export type GroupAttributes = {
    /** A Namespace of Schemas. */
    of: SchemaObject;
    /** Selected schema in the group. */
    selected?: string;
};

/** 
 * Represents a schema for a group of properties with an optional selected property. 
 * Sets the `global` namespace.
*/
export type GroupSchema = BaseSchema<'group'> & GroupAttributes;


/** Attributes for a reference schema, defining the schema it refers to. */
export type RefAttributes = { /** The name of the schema this reference refers to. */ of: string; };

/** Represents a schema that refers to another schema by name of the `global` namespace. */
export type RefSchema = BaseSchema<'ref'> & RefAttributes;

/** Represents a schema that recursively refers to the `root` scope */
export type RootSchema = BaseSchema<'root'>;

/** Represents a schema that recursively refers to the `this` scope. */
export type ThisSchema = BaseSchema<'this'>;

/**
 * Represents a generic schema that can be of various kinds.
 * 
 * This type includes all possible kinds of schemas and additional properties.
 * 
 * @remarks Making Schema a BaseSchema with certain kinds speeds up (and prevents recursion errors), but you cant resolve type by kind anymore :\
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
> & Record<string, any>;

/** Type representing an object of schemas. */
export type SchemaObject = { [key: string]: Schema; };
