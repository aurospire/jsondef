import { ArraySchema, LiteralSchema, ModelSchema, GroupSchema, ObjectSchema, RecordSchema, RefSchema, TupleSchema, UnionSchema, BoundedAttributes } from "./Schema";
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
import { stringify } from "./Stringify";
import { RegexString } from "./util";

const nullSchema = () => new NullSchemaBuilder();
const anySchema = () => new AnySchemaBuilder();
const thisSchema = () => new ThisSchemaBuilder();
const rootSchema = () => new RootSchemaBuilder();
const booleanSchema = () => new BooleanSchemaBuilder();
const integerSchema = (bounds?: BoundedAttributes) => bounds ? new IntegerSchemaBuilder().bound(bounds) : new IntegerSchemaBuilder();
const numberSchema = (bounds?: BoundedAttributes) => bounds ? new NumberSchemaBuilder().bound(bounds) : new NumberSchemaBuilder();
const stringSchema = (bounds?: number | BoundedAttributes) => {
    const builder = new StringSchemaBuilder();
    if (bounds === undefined)
        return builder;
    else if (typeof bounds === 'number')
        return builder.length(bounds);
    else
        return builder.bound(bounds);
};
const dateSchema = () => new StringSchemaBuilder().date();
const timeSchema = () => new StringSchemaBuilder().time();
const datetimeSchema = () => new StringSchemaBuilder().datetime();
const uuidSchema = () => new StringSchemaBuilder().uuid();
const base64Schema = () => new StringSchemaBuilder().base64();
const emailSchema = () => new StringSchemaBuilder().email();
const regexSchema = (pattern: RegexString | RegExp) => new StringSchemaBuilder().regex(pattern);

const literalSchema = <const Of extends LiteralSchema['of']>(of: Of) => new LiteralSchemaBuilder<Of>(of);

type EnumMapper<Enum extends LiteralSchema['of'][]> = Enum extends LiteralSchema['of'][] ? { [K in keyof Enum]: LiteralSchemaBuilder<Enum[K]> } : never;

const enumSchema = <const Enum extends LiteralSchema['of'][]>(values: Enum) => new UnionSchemaBuilder<EnumMapper<Enum>>(values.map(item => literalSchema(item)) as any);

const arraySchema = <const Of extends ArraySchema['of']>(of: Of, bounds?: number | BoundedAttributes) => {
    const builder = new ArraySchemaBuilder<Of>(of);

    if (bounds === undefined)
        return builder;
    else if (typeof bounds === 'number')
        return builder.length(bounds);
    else
        return builder.bound(bounds);
};

function tupleSchema<const Of extends TupleSchema['of']>(of: Of): TupleSchemaBuilder<Of>;
function tupleSchema<const Of extends TupleSchema['of'], Rest extends TupleSchema['rest']>(of: Of, rest: Rest): TupleSchemaBuilder<Of, Rest>;
function tupleSchema<const Of extends TupleSchema['of'], Rest extends TupleSchema['rest']>(of: Of, rest?: Rest): TupleSchemaBuilder<Of, Rest> { return new TupleSchemaBuilder(of, rest); }

const recordSchema = <const Of extends RecordSchema['of']>(of: Of, bounds?: number | BoundedAttributes) => {
    const builder = new RecordSchemaBuilder<Of>(of);

    if (bounds === undefined)
        return builder;
    else if (typeof bounds === 'number')
        return builder.length(bounds);
    else
        return builder.bound(bounds);
};

const objectSchema = <const Of extends ObjectSchema['of']>(of: Of) => new ObjectSchemaBuilder<Of>(of);
const modelSchema = <const Of extends ModelSchema['of']>(of: Of) => new ModelSchemaBuilder<Of>(of);

const unionSchema = <const Of extends UnionSchema['of']>(of: Of) => new UnionSchemaBuilder<Of>(of);
const refSchema = <const Of extends RefSchema['of']>(of: Of) => new RefSchemaBuilder<Of>(of);
const groupSchema = <const Of extends GroupSchema['of']>(of: Of) => new GroupSchemaBuilder(of);

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
    stringify
};