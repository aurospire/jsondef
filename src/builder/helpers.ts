import { ArrayField, CompositeField, Field, LiteralField, ModelField, ObjectField, RecordField, RefField, TupleField, UnionField } from "../Field";
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

const nullField = () => new NullFieldBuilder();
const anyField = () => new AnyFieldBuilder();
const thisField = () => new ThisFieldBuilder();
const rootField = () => new RootFieldBuilder();
const booleanField = () => new BooleanFieldBuilder();
const integerField = () => new IntegerFieldBuilder();
const numberField = () => new NumberFieldBuilder();
const stringField = () => new StringFieldBuilder();
const literalField = <Of extends LiteralField['of']>(of: Of) => new LiteralFieldBuilder(of);
const arrayField = <Of extends ArrayField['of']>(of: Of) => new ArrayFieldBuilder(of);

function tupleField<Of extends TupleField['of']>(of: Of): TupleFieldBuilder<Of>;
function tupleField<Of extends TupleField['of'], Rest extends TupleField['rest']>(of: Of, rest: Rest): TupleFieldBuilder<Of, Rest>;
function tupleField<Of extends TupleField['of'], Rest extends TupleField['rest']>(of: Of, rest?: Rest): TupleFieldBuilder<Of, Rest> { return new TupleFieldBuilder(of, rest); }

function recordField(): RecordFieldBuilder;
function recordField<Of extends RecordField['of']>(of: Of): RecordFieldBuilder<Of>;
function recordField<Of extends RecordField['of']>(of?: Of): RecordFieldBuilder<Of> { return new RecordFieldBuilder<Of>(of as Of); }

const objectField = <Of extends ObjectField['of']>(of: Of) => new ObjectFieldBuilder(of);
const modelField = <Of extends ModelField['of']>(name: string, of: Of) => new ModelFieldBuilder(of, name);

const compositeField = <Of extends CompositeField['of']>(of: Of) => new CompositeFieldBuilder(of);
const unionField = <Of extends UnionField['of']>(of: Of) => new UnionFieldBuilder(of);
const refField = <Of extends RefField['of']>(of: Of) => new RefFieldBuilder(of);

const namespace = <Fields extends { [key: string]: Field; }>(fields: Fields): Fields => {
    return fields;
};

export {
    nullField as null,
    anyField as any,
    thisField as this,
    rootField as root,
    booleanField as booleanl,
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
    refField as ref
};