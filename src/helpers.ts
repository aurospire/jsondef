import { ArraySchema, LiteralSchema, ModelSchema, GroupSchema, ObjectSchema, RecordSchema, RefSchema, TupleSchema, UnionSchema, BoundedAttributes, SizedAttributes, Schema } from "./Schema";
import { InferSchema } from "./Infer";
import { AnySchemaBuilder } from "./builder/AnySchemaBuilder";
import { ArraySchemaBuilder } from './builder/ArraySchemaBuilder';
import { BooleanSchemaBuilder } from "./builder/BooleanSchemaBuilder";
import { IntegerSchemaBuilder } from "./builder/IntegerSchemaBuilder";
import { LiteralSchemaBuilder } from "./builder/LiteralSchemaBuilder";
import { ModelSchemaBuilder } from './builder/ModelSchemaBuilder';
import { GroupSchemaBuilder } from "./builder/GroupSchemaBuilder";
import { NullSchemaBuilder } from "./builder/NullSchemaBuilder";
import { NumberSchemaBuilder } from "./builder/NumberSchemaBuilder";
import { ObjectSchemaBuilder } from './builder/ObjectSchemaBuilder';
import { RecordSchemaBuilder } from './builder/RecordSchemaBuilder';
import { RefSchemaBuilder } from './builder/RefSchemaBuilder';
import { RootSchemaBuilder } from "./builder/RootSchemaBuilder";
import { StringSchemaBuilder } from "./builder/StringSchemaBuilder";
import { ThisSchemaBuilder } from "./builder/ThisSchemaBuilder";
import { TupleSchemaBuilder } from './builder/TupleSchemaBuilder';
import { UnionSchemaBuilder } from './builder/UnionSchemaBuilder';
import { validate } from "./validate";
import { stringify } from "./stringify/stringify";
import { RegexString, Result, ResultError, Token } from "./util";
import { parseJsonDef, tokenizeJsonDef } from "./parser";

/** Creates a new NullSchemaBuilder instance */
const nullSchema = () => new NullSchemaBuilder();

/** Creates a new AnySchemaBuilder instance */
const anySchema = () => new AnySchemaBuilder();

/** Creates a new ThisSchemaBuilder instance */
const thisSchema = () => new ThisSchemaBuilder();

/** Creates a new RootSchemaBuilder instance */
const rootSchema = () => new RootSchemaBuilder();

/** Creates a new BooleanSchemaBuilder instance */
const booleanSchema = () => new BooleanSchemaBuilder();

/**
 * Creates a new IntegerSchemaBuilder instance with optional bounds
 * @param bounds - Optional bounds for the integer schema
 */
const integerSchema = (bounds?: BoundedAttributes) => bounds ? new IntegerSchemaBuilder().bound(bounds) : new IntegerSchemaBuilder();

/**
 * Creates a new NumberSchemaBuilder instance with optional bounds
 * @param bounds - Optional bounds for the number schema
 */
const numberSchema = (bounds?: BoundedAttributes) => bounds ? new NumberSchemaBuilder().bound(bounds) : new NumberSchemaBuilder();

/**
 * Creates a new StringSchemaBuilder instance with optional size constraints
 * @param size - Optional size constraints for the string schema
 */
const stringSchema = (size?: SizedAttributes) => size ? new StringSchemaBuilder().size(size) : new StringSchemaBuilder();

/**
 * Creates a new StringSchemaBuilder instance for date strings with optional size constraints
 * @param size - Optional size constraints for the date string schema
 */
const dateSchema = (size?: SizedAttributes) => size ? new StringSchemaBuilder().date().size(size) : new StringSchemaBuilder().date();

/**
 * Creates a new StringSchemaBuilder instance for time strings with optional size constraints
 * @param size - Optional size constraints for the time string schema
 */
const timeSchema = (size?: SizedAttributes) => size ? new StringSchemaBuilder().time().size(size) : new StringSchemaBuilder().time();

/**
 * Creates a new StringSchemaBuilder instance for datetime strings with optional size constraints
 * @param size - Optional size constraints for the datetime string schema
 */
const datetimeSchema = (size?: SizedAttributes) => size ? new StringSchemaBuilder().datetime().size(size) : new StringSchemaBuilder().datetime();

/**
 * Creates a new StringSchemaBuilder instance for UUID strings with optional size constraints
 * @param size - Optional size constraints for the UUID string schema
 */
const uuidSchema = (size?: SizedAttributes) => size ? new StringSchemaBuilder().uuid().size(size) : new StringSchemaBuilder().uuid();

/**
 * Creates a new StringSchemaBuilder instance for base64 strings with optional size constraints
 * @param size - Optional size constraints for the base64 string schema
 */
const base64Schema = (size?: SizedAttributes) => size ? new StringSchemaBuilder().base64().size(size) : new StringSchemaBuilder().base64();

/**
 * Creates a new StringSchemaBuilder instance for email strings with optional size constraints
 * @param size - Optional size constraints for the email string schema
 */
const emailSchema = (size?: SizedAttributes) => size ? new StringSchemaBuilder().email().size(size) : new StringSchemaBuilder().email();

/**
 * Creates a new StringSchemaBuilder instance for regex-based strings with optional size constraints
 * @param pattern - The regex pattern for the string schema
 * @param size - Optional size constraints for the regex-based string schema
 */
const regexSchema = (pattern: RegexString | RegExp, size?: SizedAttributes) => size ? new StringSchemaBuilder().regex(pattern).size(size) : new StringSchemaBuilder().regex(pattern);

/**
 * Creates a new LiteralSchemaBuilder instance for a specific literal value
 * @param of - The literal value for the schema
 */
const literalSchema = <const Of extends LiteralSchema['of']>(of: Of) => new LiteralSchemaBuilder<Of>(of);

type EnumMapper<Enum extends LiteralSchema['of'][]> = Enum extends LiteralSchema['of'][] ? { [K in keyof Enum]: LiteralSchemaBuilder<Enum[K]> } : never;

/**
 * Creates a new UnionSchemaBuilder instance for an enum-like set of LiteralSchemas
 * @param values - An array of literal values representing the enum
 */
const enumSchema = <const Enum extends LiteralSchema['of'][]>(values: Enum) => new UnionSchemaBuilder<EnumMapper<Enum>>(values.map(item => literalSchema(item)) as any);

/**
 * Creates a new ArraySchemaBuilder instance with a specific element type and optional size constraints
 * @param of - The schema for the array elements
 * @param size - Optional size constraints for the array schema
 */
const arraySchema = <const Of extends ArraySchema['of']>(of: Of, size?: SizedAttributes) => size ? new ArraySchemaBuilder<Of>(of).size(size) : new ArraySchemaBuilder<Of>(of);

/**
 * Creates a new TupleSchemaBuilder instance with specific element types and an optional rest schema
 * @param of - An array of schemas representing the tuple elements
 * @param rest - Optional schema for additional elements beyond the fixed tuple
 */
function tupleSchema<const Of extends TupleSchema['of']>(of: Of): TupleSchemaBuilder<Of>;
function tupleSchema<const Of extends TupleSchema['of'], Rest extends TupleSchema['rest']>(of: Of, rest: Rest): TupleSchemaBuilder<Of, Rest>;
function tupleSchema<const Of extends TupleSchema['of'], Rest extends TupleSchema['rest']>(of: Of, rest?: Rest): TupleSchemaBuilder<Of, Rest> { return new TupleSchemaBuilder(of, rest); }

/**
 * Creates a new RecordSchemaBuilder instance with a specific value type and optional size constraints
 * @param of - The schema for the record values
 * @param size - Optional size constraints for the record schema
 */
const recordSchema = <const Of extends RecordSchema['of']>(of: Of, size?: SizedAttributes) => (size === undefined) ? new RecordSchemaBuilder<Of>(of) : new RecordSchemaBuilder<Of>(of).size(size);

/**
 * Creates a new ObjectSchemaBuilder instance with specific properties
 * @param of - An object describing the properties of the object schema
 */
const objectSchema = <const Of extends ObjectSchema['of']>(of: Of) => new ObjectSchemaBuilder<Of>(of);

/**
 * Creates a new ModelSchemaBuilder instance with specific properties
 * @param of - An object describing the properties of the model schema
 */
const modelSchema = <const Of extends ModelSchema['of']>(of: Of) => new ModelSchemaBuilder<Of>(of);

/**
 * Creates a new UnionSchemaBuilder instance with specific schemas
 * @param of - An array of schemas representing the union types
 */
const unionSchema = <const Of extends UnionSchema['of']>(of: Of) => new UnionSchemaBuilder<Of>(of);

/**
 * Creates a new RefSchemaBuilder instance referencing another schema
 * @param of - The name of the schema this reference refers to
 */
const refSchema = <const Of extends RefSchema['of']>(of: Of) => new RefSchemaBuilder<Of>(of);

/**
 * Creates a new GroupSchemaBuilder instance with specific schemas
 * @param of - An object describing the schemas in the group
 */
const groupSchema = <const Of extends GroupSchema['of']>(of: Of) => new GroupSchemaBuilder(of);


/**
 * Attempts to parse a JSON definition string into a Schema object.
 * 
 * @param jsondef - The JSON definition string to parse.
 * @returns A Result object containing either the parsed Schema or Token-based issues.
 */
const tryParse = (jsondef: string): Result<Schema, Token> => {
    const tokens = tokenizeJsonDef(jsondef);

    return parseJsonDef([...tokens]);
};

/**
 * Parses a JSON definition string into a Schema object.
 * 
 * @param jsondef - The JSON definition string to parse.
 * @returns The parsed Schema object.
 * @throws {ResultError<Token>} If parsing fails, throws an error with details about the parsing issues.
 */
const parse = (jsondef: string): Schema => {
    const result = tryParse(jsondef);

    if (result.success)
        return result.value;
    else
        throw new ResultError<Token>('Jsondef Parsing Error', result.issues);
};

// const summary = () => {
//     // TODO: Return a brief summary how jsondef works for LLMs
//     return `
// jsondef is a ts-like subset JSON schema.
// model{...} sets a new root and local scope,
// {...} sets a new local scope (or root if top level).
// for recursion: 'root' references root, 'this' references local,
// group{...} sets a new namespace. identifiers refer to items in group.
// schemas can have bounds, integer,number,string,record are within parentheses,array bounds are in square brackets.
// `.trimStart();
// };

/**
 * Provides a concise summary of jsondef for use as a system prompt for LLMs.
 * 
 * @returns A string containing a comprehensive explanation of jsondef's key concepts and syntax.
 */
const summary = () => {
    return `
jsondef is a TypeScript-like subset of JSON Schema:
- 'model{...}' defines a new root and local scope
- '{...}' sets a local scope (or root if top-level)
- 'root' references root scope, 'this' references local scope, used for recursion
- 'group{...}' creates a new namespace; identifiers refer to items in the group
- String formats: date, time, datetime, uuid, email, base64, /regex/
- Integer/Number/String/Array/Record can have bounds (<, <=, >=,>), String/Array/Record can have exact size (=)
- Bounds for all but Array are in (), Array are in []
`.trim();
};

// import from this file as 'd' to use these methods
// example: d.null();
export {
    nullSchema as null,
    anySchema as any,
    booleanSchema as boolean,
    integerSchema as integer,
    numberSchema as number,
    stringSchema as string,
    dateSchema as date,
    timeSchema as time,
    datetimeSchema as datetime,
    uuidSchema as uuid,
    base64Schema as base64,
    emailSchema as email,
    regexSchema as regex,
    literalSchema as literal,
    enumSchema as enum,
    arraySchema as array,
    tupleSchema as tuple,
    recordSchema as record,
    objectSchema as object,
    modelSchema as model,
    thisSchema as this,
    rootSchema as root,
    unionSchema as union,
    groupSchema as group,
    refSchema as ref,
    InferSchema as infer,
    validate,
    stringify,
    tryParse,
    parse,
    summary
};