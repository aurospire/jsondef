import { LiteralField } from '../Field';
import { AnyFieldBuilder } from './AnyFieldBuilder';
import { BooleanFieldBuilder } from './BooleanFieldBuilder';
import { IntegerFieldBuilder } from './IntegerFieldBuilder';
import { LiteralFieldBuilder } from './LiteralFieldBuilder';
import { NullFieldBuilder } from './NullFieldBuilder';
import { NumberFieldBuilder } from './NumberFieldBuilder';
import { StringFieldBuilder } from './StringFieldBuilder';

export * from './AnyFieldBuilder';
export * from './BaseFieldBuilder';
export * from './BooleanFieldBuilder';
export * from './BoundedFieldBuilder';
export * from './IntegerFieldBuilder';
export * from './LiteralFieldBuilder';
export * from './NullFieldBuilder';
export * from './NumberFieldBuilder';
export * from './StringFieldBuilder';

const nullField = () => new NullFieldBuilder();
const anyField = () => new AnyFieldBuilder();
const booleanField = () => new BooleanFieldBuilder();
const integerField = () => new IntegerFieldBuilder();
const numberField = () => new NumberFieldBuilder();
const stringField = () => new StringFieldBuilder();
const literalField = <Of extends LiteralField['of']>(of: Of) => new LiteralFieldBuilder(of);

