import { RegexString } from "./util/RegexString";

export type BaseAttributes = { description?: string; isOptional?: boolean; };

export type BaseSchema<Kind extends string> = { kind: Kind; } & BaseAttributes;

export type NullSchema = BaseSchema<'null'>;

export type AnySchema = BaseSchema<'any'>;

export type BooleanSchema = BaseSchema<'boolean'>;

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

export type IntegerSchema = BaseSchema<'integer'> & BoundedAttributes;

export type NumberSchema = BaseSchema<'number'> & BoundedAttributes;

export type SizedAttributes = BoundedAttributes & {
    exact?: number;
};

export type StringSchemaFormat =
    | 'date'
    | 'time'
    | 'datetime'
    | 'uuid'
    | 'email'
    | 'base64'
    ;

export type StringAttributes = { of?: StringSchemaFormat | RegexString | RegExp; };

export type StringSchema = BaseSchema<'string'> & SizedAttributes & StringAttributes;


export type LiteralAttributes = { of: boolean | number | string; };

export type LiteralSchema = BaseSchema<'literal'> & LiteralAttributes;


export type ArrayAttributes = { of: Schema; };

export type ArraySchema = BaseSchema<'array'> & SizedAttributes & ArrayAttributes;


export type TupleAttributes = { of: Schema[]; rest?: ArraySchema; };

export type TupleSchema = BaseSchema<'tuple'> & TupleAttributes;


export type RecordAttributes = { of: Schema; key?: StringSchema; };

export type RecordSchema = BaseSchema<'record'> & SizedAttributes & RecordAttributes;


export type UnionAttributes = { of: Schema[]; };

export type UnionSchema = BaseSchema<'union'> & UnionAttributes;


export type ObjectAttributes = { of: SchemaObject; };

export type ObjectSchema = BaseSchema<'object'> & ObjectAttributes;


export type ModelAttributes = { of: SchemaObject; };

export type ModelSchema = BaseSchema<'model'> & ModelAttributes;


export type GroupAttributes = { of: SchemaObject; selected?: string; };

export type GroupSchema = BaseSchema<'group'> & GroupAttributes;


// Refers to Schemas in Ancestor group
export type RefAttributes = { of: string; };

export type RefSchema = BaseSchema<'ref'> & RefAttributes;

// Refers to top level Object or closest Model
export type RootSchema = BaseSchema<'root'>;

// Refers to current Object or Model
export type ThisSchema = BaseSchema<'this'>;

// Making Schema a BaseSchema with certain kinds speeds up (and prevents recursion errors)
// but you cant resolve type by kind anymore :\
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

export type SchemaObject = { [key: string]: Schema; };
