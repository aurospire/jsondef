import { ArrayField, CompositeField, Field, LiteralField, ModelField, NamespaceField, ObjectField, RecordField, RefField, TupleField, UnionField } from "../Field";
import { AnyFieldBuilder } from "./AnyFieldBuilder";
import { ThisFieldBuilder } from "./ThisFieldBuilder";
import { RootFieldBuilder } from "./RootFieldBuilder";
import { BooleanFieldBuilder } from "./BooleanFieldBuilder";
import { IntegerFieldBuilder } from "./IntegerFieldBuilder";
import { LiteralFieldBuilder } from "./LiteralFieldBuilder";
import { NullFieldBuilder } from "./NullFieldBuilder";
import { NumberFieldBuilder } from "./NumberFieldBuilder";
import { StringFieldBuilder } from "./StringFieldBuilder";
import { ArrayFieldBuilder } from './ArrayFieldBuilder';
import { TupleFieldBuilder } from './TupleFieldBuilder';
import { RecordFieldBuilder } from './RecordFieldBuilder';
import { ObjectFieldBuilder } from './ObjectFieldBuilder';
import { ModelFieldBuilder } from './ModelFieldBuilder';
import { CompositeFieldBuilder } from './CompositeFieldBuilder';
import { UnionFieldBuilder } from './UnionFieldBuilder';
import { RefFieldBuilder } from './RefFieldBuilder';
import { InferField } from "../Infer";
import { NamespaceFieldBuilder } from "./NamespaceFieldBuilder";

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
    thisField as this,
    rootField as root,
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
    unionField as union,
    namespaceField as namespace,
    refField as ref,
    InferField as infer
};