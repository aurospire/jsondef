// import { AnyField, ArrayAttributes, BaseAttributes, BooleanField, BoundedAttributes, Field, FieldObject, IntegerField, LiteralAttributes, LiteralField, NullField, NumberField, RecordAttributes, SizedAttributes, StringAttributes, StringField, TupleField, TupleItem, UnionAttributes } from "../Field";
// import { InferField } from "../Infer";

// export const anyField = (attributes: BaseAttributes = {}) => {
//     return { kind: 'any', ...attributes } as const;
// };

// export const nullField = (attributes: BaseAttributes = {}): NullField => {
//     return { kind: 'null', ...attributes } as const;
// };

// export const booleanField = (attributes: BaseAttributes = {}) => {
//     return { kind: 'boolean', ...attributes } as const;
// };

// export const integerField = (attributes: BaseAttributes & BoundedAttributes = {}) => {
//     return { kind: 'integer', ...attributes } as const;
// };

// export const numberField = (attributes: BaseAttributes & BoundedAttributes = {}) => {
//     return { kind: 'number', ...attributes } as const;
// };

// export const stringField = (attributes: BaseAttributes & StringAttributes & BoundedAttributes & SizedAttributes = {}) => {
//     return { kind: 'string', ...attributes } as const;
// };

// export const literalField = <const T extends LiteralAttributes['of']>(of: T, attributes: BaseAttributes = {}) => {
//     return { kind: 'literal', of, ...attributes } as const;
// };

// export const arrayField = <const T extends ArrayAttributes['of']>(of: T, attributes: BaseAttributes & BoundedAttributes & SizedAttributes = {}) => {
//     return { kind: 'array', of, ...attributes } as const;
// };

// export function tupleField<const T extends TupleItem[]>(of: T, attributes?: BaseAttributes): { kind: 'tuple', of: T; } & BaseAttributes;
// export function tupleField<const T extends TupleItem[], R extends TupleItem>(of: T, rest: R, attributes?: BaseAttributes): { kind: 'tuple', of: T, rest: R; } & BaseAttributes;
// export function tupleField<const T extends TupleItem[], R extends TupleItem | undefined = undefined>(
//     of: T,
//     restOrAttributes?: R | BaseAttributes,
//     maybeAttributes?: BaseAttributes
// ) {
//     if (!maybeAttributes) {
//         // This is the case without 'rest'
//         return { kind: 'tuple', of, ...(restOrAttributes ?? {}) } as const;
//     }
//     else {
//         // This is the case with 'rest'
//         const rest = restOrAttributes as R;
//         const attributes = maybeAttributes ?? {};
//         return { kind: 'tuple', of, rest, ...attributes } as const;
//     }
// }

// export function recordField(attributes?: BaseAttributes & Omit<RecordAttributes, 'of'>): { kind: 'record'; } & BaseAttributes & Omit<RecordAttributes, 'of'>;
// export function recordField<const T extends RecordAttributes['of']>(of: T, attributes?: BaseAttributes & Omit<RecordAttributes, 'of'>): { kind: 'record', of: T; } & BaseAttributes & Omit<RecordAttributes, 'of'>;
// export function recordField<const T extends RecordAttributes['of']>(
//     ofOrAttributes?: T | (BaseAttributes & Omit<RecordAttributes, 'of'>),
//     maybeAttributes?: BaseAttributes & Omit<RecordAttributes, 'of'>
// ) {
//     if (typeof ofOrAttributes === 'undefined') {
//         // Case: recordField()
//         return { kind: 'record' } as const;
//     } else if (typeof ofOrAttributes === 'object' && !Array.isArray(ofOrAttributes)) {
//         // Case: recordField(attributes)
//         return { kind: 'record', ...ofOrAttributes } as const;
//     } else {
//         // Case: recordField(of, attributes)
//         const of = ofOrAttributes as T;
//         const attributes = maybeAttributes || {};
//         return { kind: 'record', of, ...attributes } as const;
//     }
// }

// export const objectField = <const T extends FieldObject>(of: T, attributes: BaseAttributes = {}) => {
//     return { kind: 'object', of, ...attributes } as const;
// };

// export const unionField = <const T extends UnionAttributes['of']>(of: T, attributes: BaseAttributes = {}) => {
//     return { kind: 'union', of, ...attributes } as const;
// };

// export const thisField = (attributes: BaseAttributes = {}) => {
//     return { kind: 'this', ...attributes } as const;
// };

// export const rootField = (attributes: BaseAttributes = {}) => {
//     return { kind: 'root', ...attributes } as const;
// };

// const a =
//     // anyField()
//     // nullField()
//     // booleanField()
//     // integerField()
//     // numberField()
//     // stringField()
//     // literalField('hello') satisfies LiteralField
//     // arrayField(literalField(2));
//     // tupleField([nullField(), booleanField(), literalField(2)], stringField());
//     // recordField(booleanField());
//     // unionField([booleanField(), stringField()])
//     objectField({
//         a: booleanField({ optional: true }),
//     });
// // thisField();
// // rootField()

// type b = typeof a;

// type a = InferField<b>;




// class NullBuilder<Optional extends boolean> implements NullField {
//     #attributes: BaseAttributes;

//     constructor(NullBuilder) {
//         this.#attributes = { isOptional: false, ...attributes };
//     }

//     get kind(): NullField['kind'] { return 'null' as const; }

//     get isOptional(): Optional { return this.#attributes.isOptional as Optional; }

//     get description(): NullField['description'] { return this.#attributes.description; }

//     describe(description?: string): NullBuilder<Optional> {
//         return new NullBuilder({ ...this.#attributes, description });
//     }

//     optional(): NullBuilder<false> {
//         return new NullBuilder({ ...this.#attributes, isOptional: true });
//     }

//     required(): NullBuilder<true> {
//         return new NullBuilder({ ...this.#attributes, isOptional: false });
//     }
// }