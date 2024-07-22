export * from './BaseFieldBuilder';
export * from './NullFieldBuilder';
export * from './AnyFieldBuilder';
export * from './BooleanFieldBuilder';

export * from './BoundedFieldBuilder';
export * from './NumberFieldBuilder';
export * from './IntegerFieldBuilder';

export * from './PositiveBoundedFieldBuilder';
export * from './StringFieldBuilder';

export * from './LiteralFieldBuilder';
export * from './ArrayFieldBuilder';
export * from './TupleFieldBuilder';
export * from './RecordFieldBuilder';
export * from './ObjectFieldBuilder';
export * from './ModelFieldBuilder';
export * from './CompositeFieldBuilder';
export * from './UnionFieldBuilder';
export * from './RefFieldBuilder';

export * as j from './helpers';

import { InferField } from '../Infer';
import * as j from './helpers';

const a = j.model('User', {
    first: j.string().bound({ max: 10 }),
    last: j.string().bound({ max: 10 }),
    middle: j.string().bound({ max: 1 }).optional(),    
    this: j.this().optional()
});

type a = InferField<typeof a>;

const b: a = {
    first: '',
    last: '',
    this: {
        first: 'a',
        last: 'b'
    }
}