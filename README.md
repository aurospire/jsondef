# jsondef

A TypeScript-like JSON Schema definition library that simplifies the creation, validation, and manipulation of JSON schemas. `jsondef` provides a concise and expressive syntax for defining complex data structures, making schema definitions more readable and maintainable.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Syntax Overview](#syntax-overview)
- [API Reference](#api-reference)
  - [Schema Builders](#schema-builders)
  - [Parsing and Stringifying](#parsing-and-stringifying)
  - [Validation](#validation)
  - [Type Inference](#type-inference)
- [License](#license)

## Features

- **TypeScript-like Syntax**: Familiar syntax for defining JSON schemas.
- **Expressive Constraints**: Easily define bounds and size constraints.
- **Scopes and Namespaces**: Use `root`, `this`, and named references for complex schemas.
- **Extensible Types**: Support for primitive, complex, and custom types.
- **Validation and Parsing**: Validate data against schemas and parse schema definitions.
- **Type Inference**: Infer TypeScript types directly from schemas.

## Installation

Install `jsondef` using npm (or yarn):

```bash
npm install jsondef
```

## Syntax Overview

`jsondef` provides a powerful and expressive syntax for defining JSON schemas. The syntax is inspired by TypeScript and allows for defining complex data structures with ease.

### Simple Schemas

#### Any
Represents any valid JSON value.

  ```js
  any
  ```

#### Null
Represents a `null` value.

  ```js
  null
  ```

#### Boolean
Represents a `true` or `false` value.

  ```js
  boolean
  ```

#### Numeric

Represents an `integer` or `number` value with optional bounds, defined using relational operators:

  - **Operators**:
    - **`>`**: Greater than
    - **`>=`**: Greater than or equal to
    - **`<`**: Less than
    - **`<=`**: Less than or equal to

  - **Examples**:

    ```js
    integer                   // Unbounded Integer    
    number                    // Unbounded Number
    integer(>0)               // Integers greater than 0
    number(>=-12.2, <=100e+2) // Numbers between -12.2 and 100e+2 inclusive
    ```
    
#### Literals

Represents a literal boolean, integer, number, or string.

  - **Boolean Literal**:

    ```js
    true
    false
    ```

  - **String Literal**: Enclosed in single quotes.

    ```js
    'active'
    'with\tescapes\n'
    ```

  - **Integer Literal**:

    ```js
    42
    -12
    ```

  - **Number Literal**

    ```js
    3.14
    -231.2
    2.3e+12
    ```

#### String

Represents a string with optional formats, regex patterns, and size constraints.

- **Formats**:
  - **`string`**: Basic string
  - **`date`**, **`time`**, **`datetime`**: Date and time formats
  - **`uuid`**, **`email`**, **`base64`**: Specific string formats
  - **Regex Patterns**: /pattern/[flags]

- **Size Constraints**:

  Use bounds to specify string length:

  - **Operators**:
    - **`>`**, **`>=`**, **`<`**, **`<=`**, **`=`**

  - **Examples**:

    ```js
    string(<=100)             // String with max length 100
    uuid                      // String in UUID format
    email                     // String in email format
    /^(?:\+?\d{1,3})?[ -]?\d{7,14}$/ // Custom regex pattern
    ```

### Complex Types

#### Arrays

Represnts arrays of elements conforming to a schema, with optional size bounds.

- **Syntax**:

  ```js
  <SCHEMA>[<BOUNDS>]
  ```

- **Examples**:

  ```js
  integer[>=1, <=10] // Array of integers with length between 1 and 10
  string[]           // Array of strings of any length
  ```

#### Records

Represents objects with dynamic keys and consistent value types, with optional size bounds

- **Syntax**:

  ```js
  record<SCHEMA>(<BOUNDS>)
  record<KEY_SCHEMA, VALUE_SCHEMA>(<BOUNDS>)
  ```

- **Examples**:

  ```js
  record<string>                 // Object with string values
  record<string, integer>        // Object with string keys and integer values
  record<uuid, { name: string }> // Object with UUID keys and objects as values
  record<boolean>(=10)           // Object with boolean values of exactly 10
  ```

#### Tuples

Represents fixed-size arrays with specific types for each element.

- **Syntax**:

  ```js
  [SCHEMA0, SCHEMA1, ...REST]
  ```

- **Examples**:

  ```js
  [string, integer, boolean]          // Tuple with a string, an integer, and a boolean
  [string, ...integer[]]              // Tuple starting with a string followed by any number of integers
  ```

#### Unions

Define a type that can be one of several specified schemas.

- **Syntax**:

  ```js
  SCHEMA0 | SCHEMA1 | ... | SCHEMAN
  ```

- **Examples**:

  ```js
  integer | 'active' | 'inactive' // Can be an integer or one of the specified string literals
  boolean | null                  // Can be a boolean or null
  ```

#### Objects

Represents objects with specific properties.

- Creates a local scope, that can be recursively referenced with a `this` schema.

- If the object is top level, also sets the root scope, whic hcan be recursively referenced with a `root` schema.

- Similar to typescript, use `?:` instead of `:` to denote optional properties.

- **Syntax**:

  ```js
  { KEY0: SCHEMA0, KEY1: SCHEMA1, }
  ```

- **Examples**:

  ```js
  {
    name: string,
    age: integer(>=0),
    email?: email       // Optional property
  }
  ```

#### Models

Similar to objects, but sets the root scope wherever it is.

- **Syntax**:

  ```js
  model {
    KEY0: SCHEMA0,
    KEY1: SCHEMA1
  }
  ```

- **Examples**:

  ```js
  model {
    name: string,
    parent?: root // Recursive reference to the model itself
  }
  ```

#### Groups and Namespaces

Represents a group of schemas under a single namespace. You can select a specific schema from the group.

- **Syntax**:

  ```js
  group {
    KEY0: SCHEMA0,
    KEY1: SCHEMA1
  }
  ```

- **Select a Schema from a Group**:

  ```js
  select <KEY> of group {
    KEY0: SCHEMA0,
    KEY1: SCHEMA1
  }
  ```

- **Examples**:

  ```js
  // Simple group, no references or selections
  group {
    User: model { id: uuid, name: string },
    Admin: model { id: uuid, name: string, role: 'admin' }
  }

  // Selection from a group
  select User of group {
    User: model { id: uuid, name: string },
    Admin: model { id: uuid, name: string, role: 'admin' }
  }

  // Selection and Reference
  select User of group {
    User: model { id: uuid, name: string, role: Role },
    Role: 'user' | 'admin'
  }
  ```

### References and Scopes

#### `root` and `this`

- **`root`**: References the root scope of the current model, useful for recursive definitions that need to refer back to the root.

- **`this`**: References the local scope of the current model, allowing for recursion within the same level.

- **Example**:

  ```js
  model {
    name: string(),
    age: integer(>=0),
    role: {
      title: string,
      manager: root,  // rescursively references the entire model
      subrole?: this  // recursively references the current object (role)
    }
  }
  ```


#### Identifiers (`<IDENTIFIER>`)

References a named schema within an ancestor group's namespace.

- **Example**:

  ```js
  group {
    Node: model {
      value: integer,
      next: Node | null
    }
  }
  ```

  Here, `Node` is used as an identifier to reference the `Node` schema within the same group.

## API Reference

The `d` namespace provides a set of functions to build, parse, validate, and infer schemas programmatically.

### Schema Builders

Schema Builders use a Fluid style to allow easy creation of schemas.

- All Schema Builders have `.optional()` and `.required()` methods used for optional properties with models and objects.

#### `d.null()`

Creates a `NullSchemaBuilder` instance representing a `null` value.

**Usage:**

```ts
const nullSchema = d.null();
```

#### `d.any()`

Creates an `AnySchemaBuilder` instance representing any value.

**Usage:**

```ts
const anySchema = d.any();
```

#### `d.boolean()`

Creates a `BooleanSchemaBuilder` instance representing a boolean value.

**Usage:**

```ts
const booleanSchema = d.boolean();
```

#### `d.root()`

Creates a `RootSchemaBuilder` instance referencing the root scope.

**Usage:**

```ts
const rootSchema = d.root();
```

#### `d.this()`

Creates a `ThisSchemaBuilder` instance referencing the local scope.

**Usage:**

```ts
const thisSchema = d.this();
```

#### `d.integer(bounds?: BoundedAttributes)`

Creates an `IntegerSchemaBuilder` instance with optional bounds.

**Usage:**

```ts
const positiveInteger = d.integer({ min: 1 });
```

#### `d.number(bounds?: BoundedAttributes)`

Creates a `NumberSchemaBuilder` instance with optional bounds.

**Usage:**

```ts
const percentage = d.number({ min: 0, max: 100 });
```

#### `d.string(size?: SizedAttributes)`

Creates a `StringSchemaBuilder` instance with optional size constraints.

**Usage:**

```ts
const shortString = d.string({ max: 50 });
```

#### `d.date()`, `d.time()`, `d.datetime()`, `d.uuid()`, `d.email()`, `d.base64()`

Creates a `StringSchemaBuilder` instance for specific formats.

**Usage:**

```ts
const emailSchema = d.email();
const uuidSchema = d.uuid();
```

#### `d.regex(pattern: RegExp | RegexString, size?: SizedAttributes)`

Creates a `StringSchemaBuilder` instance with a custom regex pattern.

- **Parameters:**
  - `pattern`: A `RegExp` object or regex string.
  - `size` (optional): Size constraints.

**Usage:**

```ts
const customString = d.regex(/^[a-z]+$/i);
```

#### `d.literal(value: boolean | string | number)`

Creates a `LiteralSchemaBuilder` instance for a specific literal value.

**Usage:**

```ts
const activeStatus = d.literal('active');
```

#### `d.enum(values: (boolean | string | number)[])`

Creates a `UnionSchemaBuilder` instance representing an enum of literals.

**Usage:**

```ts
const statusEnum = d.enum(['active', 'inactive', 'pending']);
```

#### `d.array(of: Schema, size?: SizedAttributes)`

Creates an `ArraySchemaBuilder` instance for arrays of a specific schema.

**Usage:**

```ts
const stringArray = d.array(d.string(), { min: 1 });
```

#### `d.tuple(of: Schema, rest?: ArraySchema)`

Creates a `TupleSchemaBuilder` instance for tuples.

- **Parameters:**
  - `of`: An array of schemas for the tuple elements.
  - `rest` (optional): A schema for additional elements.

**Usage:**

```ts
const mixedTuple = d.tuple([d.string(), d.integer()]);
```

#### `d.record(of: , size?)`

Creates a `RecordSchemaBuilder` instance for objects with uniform value types.


**Special Methods:**
```ts
// Constrains the key that the record can be indexed by
builder.by(key: StringSchema): RecordSchemaBuilder
```

**Usage:**

```ts
const numberRecord = d.record(d.number());

const uuidNumberRecord = numberRecord.by(d.uuid());
```


#### `d.object(of: SchemaObject)`

Creates an `ObjectSchemaBuilder` instance for an object with specified properties.

**Usage:**

```ts
const userObject = d.object({
  username: d.string(),
  password: d.string()
});
```

#### `d.model(of: SchemaObject)`

Creates a `ModelSchemaBuilder` instance, setting a new root scope.

**Usage:**

```ts
const userModel = d.model({
  username: d.string(),
  profile: d.object({
    age: d.integer(),
    bio: d.string().optional()
  })
});
```

#### `d.union(of: Schema[])`

Creates a `UnionSchemaBuilder` instance for a union of schemas.

**Usage:**

```ts
const statusUnion = d.union([d.literal('active'), d.literal('inactive')]);
```

#### `d.ref(of: string)`

Creates a `RefSchemaBuilder` instance referencing another schema in ancestral namespace by name.

**Usage:**

```ts
const employeeSchema = d.model({
  manager: d.ref('Employee')
});
```

#### `d.group(of: SchemaObject)`

Creates a `GroupSchemaBuilder` instance containing multiple schemas.

**Special Methods:**

```ts
// Sets which subschema is selected from the group
builder.select(key: keyof Of): GroupSchemaBuilder
```

**Usage:**

```ts
const schemas = d.group({
  Person: personSchema,
  Employee: employeeSchema
});

const Person = schemas.select('Person')
```

### Parsing and Stringifying

#### `d.parse(jsondef)`

Parses a `jsondef` string into a schema object.

**Usage:**

```javascript
const schema = d.parse(`
  model {
    name: string,
    age: integer(>=0)
  }
`);
```

#### `d.tryParse(jsondef)`

Attempts to parse a `jsondef` string, returning a `Result` object.

**Usage:**

```javascript
const result = d.tryParse('invalid schema');
if (result.success) {
  // Use the schema
} else {
  // Handle errors
}
```

#### `d.stringify(schema, format?, condensed?)`

Converts a schema object back into a `jsondef` string.

- **Parameters:**
  - `schema`: The schema object to stringify.
  - `format` (optional): Formatting options.
  - `condensed` (optional): Boolean indicating whether to use condensed format as base of optional supplied format.

**Usage:**

```javascript
const schemaString = d.stringify(schema);
```

### Validation

#### `d.validate(value, schema)`

Validates a value against a schema.

**Usage:**

```javascript
const result = d.validate({ name: 'John', age: 30 }, personSchema);
if (result.success) {
  // Value is valid
} else {
  // Handle validation errors
}
```

### Type Inference
#### `d.infer<Schema>(schema)`

Infers the TypeScript type from a schema.

**Usage:**

```typescript
type Person = d.infer<typeof personSchema>;
```

## License

`jsondef` is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this software in compliance with the license.
