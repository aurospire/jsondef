# jsondef

// SOME NOTES
// 1. the defined subtypes of a string are a subset of json schema's format. they are not implementation dependent, and they use the subtype as the type name
// - ex: { kind: 'string', of: /ABC/ } => /ABC/, { kind: 'string', of: 'date' } => date
// 2. the custom key of a record can only be a string type - not a literal union (just use an object/model if you need literal keys)
// 3. LOCAL scope is set by ObjectSchema or ModelSchema
// 4. ROOT scope is set by a root level ObjectSchema or ModelSchema at any level
// 5. GLOBAL namespace is set by a GroupSchema, each of the properties is a referable identifier
// 6. ThisSchema refers to the LOCAL scope (if exists) for recursion
// 7. RootSchema refers to the ROOT scope (if exists) for recursion
// 8. RefSchema refers to an identifier in the GLOBAL namespace (if exists)