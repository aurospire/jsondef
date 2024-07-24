import { ArrayField, CompositeField, LiteralField, ModelField, NamespaceField, ObjectField, RecordField, RefField, TupleField, UnionField } from "./Field";
import { InferField } from "./Infer";
import { AnyFieldBuilder } from "./builder/AnyFieldBuilder";
import { ArrayFieldBuilder } from './builder/ArrayFieldBuilder';
import { BooleanFieldBuilder } from "./builder/BooleanFieldBuilder";
import { CompositeFieldBuilder } from './builder/CompositeFieldBuilder';
import { IntegerFieldBuilder } from "./builder/IntegerFieldBuilder";
import { LiteralFieldBuilder } from "./builder/LiteralFieldBuilder";
import { ModelFieldBuilder } from './builder/ModelFieldBuilder';
import { NamespaceFieldBuilder } from "./builder/NamespaceFieldBuilder";
import { NullFieldBuilder } from "./builder/NullFieldBuilder";
import { NumberFieldBuilder } from "./builder/NumberFieldBuilder";
import { ObjectFieldBuilder } from './builder/ObjectFieldBuilder';
import { RecordFieldBuilder } from './builder/RecordFieldBuilder';
import { RefFieldBuilder } from './builder/RefFieldBuilder';
import { RootFieldBuilder } from "./builder/RootFieldBuilder";
import { StringFieldBuilder } from "./builder/StringFieldBuilder";
import { ThisFieldBuilder } from "./builder/ThisFieldBuilder";
import { TupleFieldBuilder } from './builder/TupleFieldBuilder';
import { UnionFieldBuilder } from './builder/UnionFieldBuilder';

const nullField = () => new NullFieldBuilder();
const anyField = () => new AnyFieldBuilder();
const thisField = () => new ThisFieldBuilder();
const rootField = () => new RootFieldBuilder();
const booleanField = () => new BooleanFieldBuilder();
const integerField = () => new IntegerFieldBuilder();
const numberField = () => new NumberFieldBuilder();
const stringField = () => new StringFieldBuilder();
const literalField = <const Of extends LiteralField['of']>(of: Of) => new LiteralFieldBuilder<Of>(of);
const arrayField = <const Of extends ArrayField['of']>(of: Of) => new ArrayFieldBuilder<Of>(of);

function tupleField<const Of extends TupleField['of']>(of: Of): TupleFieldBuilder<Of>;
function tupleField<const Of extends TupleField['of'], Rest extends TupleField['rest']>(of: Of, rest: Rest): TupleFieldBuilder<Of, Rest>;
function tupleField<const Of extends TupleField['of'], Rest extends TupleField['rest']>(of: Of, rest?: Rest): TupleFieldBuilder<Of, Rest> { return new TupleFieldBuilder(of, rest); }

function recordField(): RecordFieldBuilder;
function recordField<const Of extends RecordField['of']>(of: Of): RecordFieldBuilder<Of>;
function recordField<const Of extends RecordField['of']>(of?: Of): RecordFieldBuilder<Of> { return new RecordFieldBuilder<Of>(of as Of); }

const objectField = <const Of extends ObjectField['of']>(of: Of) => new ObjectFieldBuilder<Of>(of);
const modelField = <const Of extends ModelField['of']>(name: string, of: Of) => new ModelFieldBuilder<Of>(of, name);

const compositeField = <const Of extends CompositeField['of']>(of: Of) => new CompositeFieldBuilder<Of>(of);
const unionField = <const Of extends UnionField['of']>(of: Of) => new UnionFieldBuilder<Of>(of);
const refField = <const Of extends RefField['of']>(of: Of) => new RefFieldBuilder<Of>(of);
const namespaceField = <const Of extends NamespaceField['of']>(of: Of) => new NamespaceFieldBuilder(of);

// import from this file as 'j' to use these methods
// example: j.null();
export {
    nullField as null,
    anyField as any,
    booleanField as boolean,
    integerField as integer,
    numberField as number,
    stringField as string,
    literalField as literal,
    arrayField as array,
    tupleField as tuple,
    recordField as record,
    objectField as object,
    modelField as model,
    compositeField as composite,
    thisField as this,
    rootField as root,
    unionField as union,
    namespaceField as namespace,
    refField as ref,
    InferField as infer,
};
