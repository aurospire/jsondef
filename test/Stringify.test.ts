import { AnySchema, ArraySchema, BooleanSchema, GroupSchema, IntegerSchema, LiteralSchema, ModelSchema, NullSchema, NumberSchema, ObjectSchema, RecordSchema, RefSchema, RootSchema, Schema, StringSchema, ThisSchema, TupleSchema, UnionSchema } from '@/Schema';
import { stringify } from '@/stringify/stringify';

type TestCase<S extends Schema> = [title: string, schema: S, pretty: string, condensed: string];

const capitalize = (value: string) => value[0].toLocaleUpperCase() + value.slice(1);
const testStringify = <S extends Schema>([testName, schema, expectedPretty, expectedCondensed]: TestCase<S>) => {
    it(`should stringify ${testName} ${capitalize(schema.kind)}Schema (pretty)`, () => {
        expect(stringify(schema)).toBe(expectedPretty);
    });

    it(`should stringify ${testName} ${capitalize(schema.kind)}Schema (condensed)`, () => {
        expect(stringify(schema, {}, true)).toBe(expectedCondensed);
    });
};

describe('stringify', () => {
    describe('NullSchema', () => {
        const nullSchema: NullSchema = { kind: 'null' };

        it('should stringify a basic NullSchema (pretty)', () => {
            expect(stringify(nullSchema)).toBe('null');
        });

        it('should stringify a basic NullSchema (condensed)', () => {
            expect(stringify(nullSchema, {}, true)).toBe('null');
        });
    });

    describe('AnySchema', () => {
        const anySchema: AnySchema = { kind: 'any' };

        it('should stringify a basic AnySchema (pretty)', () => {
            expect(stringify(anySchema)).toBe('any');
        });

        it('should stringify a basic AnySchema (condensed)', () => {
            expect(stringify(anySchema, {}, true)).toBe('any');
        });
    });

    describe('BooleanSchema', () => {
        const booleanSchema: BooleanSchema = { kind: 'boolean' };

        it('should stringify a basic BooleanSchema (pretty)', () => {
            expect(stringify(booleanSchema)).toBe('boolean');
        });

        it('should stringify a basic BooleanSchema (condensed)', () => {
            expect(stringify(booleanSchema, {}, true)).toBe('boolean');
        });
    });

    describe('IntegerSchema', () => {
        const testCases: TestCase<IntegerSchema>[] = [
            ['basic', { kind: 'integer' }, 'integer', 'integer'],
            ['with min', { kind: 'integer', min: 0 }, 'integer(>= 0)', 'integer(>=0)'],
            ['with max', { kind: 'integer', max: 100 }, 'integer(<= 100)', 'integer(<=100)'],
            ['with min and max', { kind: 'integer', min: 0, max: 100 }, 'integer(>= 0, <= 100)', 'integer(>=0,<=100)'],
            ['with exclusive min', { kind: 'integer', xmin: 0 }, 'integer(> 0)', 'integer(>0)'],
            ['with exclusive max', { kind: 'integer', xmax: 100 }, 'integer(< 100)', 'integer(<100)'],
            ['with exclusive min and max', { kind: 'integer', xmin: 0, xmax: 100 }, 'integer(> 0, < 100)', 'integer(>0,<100)'],
            ['with min and exclusive max', { kind: 'integer', min: 0, xmax: 100 }, 'integer(>= 0, < 100)', 'integer(>=0,<100)'],
            ['with exclusive min and max', { kind: 'integer', xmin: 0, max: 100 }, 'integer(> 0, <= 100)', 'integer(>0,<=100)'],
        ];

        testCases.forEach(testStringify);
    });

    describe('NumberSchema', () => {
        const testCases: TestCase<NumberSchema>[] = [
            ['basic', { kind: 'number' }, 'number', 'number'],
            ['with min', { kind: 'number', min: 0 }, 'number(>= 0)', 'number(>=0)'],
            ['with max', { kind: 'number', max: 100 }, 'number(<= 100)', 'number(<=100)'],
            ['with min and max', { kind: 'number', min: 0, max: 100 }, 'number(>= 0, <= 100)', 'number(>=0,<=100)'],
            ['with exclusive min', { kind: 'number', xmin: 0 }, 'number(> 0)', 'number(>0)'],
            ['with exclusive max', { kind: 'number', xmax: 100 }, 'number(< 100)', 'number(<100)'],
            ['with exclusive min and max', { kind: 'number', xmin: 0, xmax: 100 }, 'number(> 0, < 100)', 'number(>0,<100)'],
            ['with min and exclusive max', { kind: 'number', min: 0, xmax: 100 }, 'number(>= 0, < 100)', 'number(>=0,<100)'],
            ['with exclusive min and max', { kind: 'number', xmin: 0, max: 100 }, 'number(> 0, <= 100)', 'number(>0,<=100)'],
        ];

        testCases.forEach(testStringify);
    });

    describe('StringSchema', () => {
        const testCases: TestCase<StringSchema>[] = [
            ['basic', { kind: 'string' }, 'string', 'string'],
            ['with min length', { kind: 'string', min: 1 }, 'string(>= 1)', 'string(>=1)'],
            ['with max length', { kind: 'string', max: 10 }, 'string(<= 10)', 'string(<=10)'],
            ['with exact length', { kind: 'string', exact: 5 }, 'string(= 5)', 'string(=5)'],
            ['with min and max length', { kind: 'string', min: 1, max: 10 }, 'string(>= 1, <= 10)', 'string(>=1,<=10)'],
            ['date format', { kind: 'string', of: 'date' }, 'date', 'date'],
            ['time format', { kind: 'string', of: 'time' }, 'time', 'time'],
            ['datetime format', { kind: 'string', of: 'datetime' }, 'datetime', 'datetime'],
            ['uuid format', { kind: 'string', of: 'uuid' }, 'uuid', 'uuid'],
            ['email format', { kind: 'string', of: 'email' }, 'email', 'email'],
            ['base64 format', { kind: 'string', of: 'base64' }, 'base64', 'base64'],
            ['with regex', { kind: 'string', of: /^[A-Z]+$/ }, '/^[A-Z]+$/', '/^[A-Z]+$/'],
            ['with regex string', { kind: 'string', of: '/^[A-Z]+$/' }, '/^[A-Z]+$/', '/^[A-Z]+$/'],
            ['with regex string and bounds', { kind: 'string', of: '/^[A-Z]+$/', xmin: 5, xmax: 10, }, '/^[A-Z]+$/(> 5, < 10)', '/^[A-Z]+$/(>5,<10)'],
        ];

        testCases.forEach(testStringify);
    });

    describe('LiteralSchema', () => {
        const testCases: TestCase<LiteralSchema>[] = [
            ['string literal', { kind: 'literal', of: 'test' }, "'test'", "'test'"],
            ['number literal', { kind: 'literal', of: 42 }, '42', '42'],
            ['boolean literal', { kind: 'literal', of: true }, 'true', 'true'],
        ];

        testCases.forEach(testStringify);
    });

    describe('ArraySchema', () => {
        const testCases: TestCase<ArraySchema>[] = [
            ['basic array', { kind: 'array', of: { kind: 'string' } }, 'string[]', 'string[]'],
            ['array with min items', { kind: 'array', of: { kind: 'number' }, min: 1 }, 'number[>= 1]', 'number[>=1]'],
            ['array with max items', { kind: 'array', of: { kind: 'boolean' }, max: 5 }, 'boolean[<= 5]', 'boolean[<=5]'],
            ['array with exact items', { kind: 'array', of: { kind: 'string' }, exact: 3 }, 'string[= 3]', 'string[=3]'],
            ['array with min and max items', { kind: 'array', of: { kind: 'number' }, min: 2, max: 4 }, 'number[>= 2, <= 4]', 'number[>=2,<=4]'],
            ['array with exclusive min', { kind: 'array', of: { kind: 'string' }, xmin: 1 }, 'string[> 1]', 'string[>1]'],
            ['array with exclusive max', { kind: 'array', of: { kind: 'boolean' }, xmax: 5 }, 'boolean[< 5]', 'boolean[<5]'],
            ['array with exclusive min and max', { kind: 'array', of: { kind: 'number' }, xmin: 2, xmax: 4 }, 'number[> 2, < 4]', 'number[>2,<4]'],
            ['array with complex item type', { kind: 'array', of: { kind: 'object', of: { name: { kind: 'string' }, age: { kind: 'number' } } } }, '{\n  name: string,\n  age: number\n}[]', '{name:string,age:number}[]'],
        ];

        testCases.forEach(testStringify);
    });

    describe('TupleSchema', () => {
        const testCases: [string, TupleSchema, string, string][] = [
            ['basic tuple', { kind: 'tuple', of: [{ kind: 'string' }, { kind: 'number' }] }, '[string, number]', '[string,number]'],
            ['tuple with multiple types', { kind: 'tuple', of: [{ kind: 'string' }, { kind: 'number' }, { kind: 'boolean' }] }, '[string, number, boolean]', '[string,number,boolean]'],
            ['tuple with rest (unbounded)', { kind: 'tuple', of: [{ kind: 'string' }, { kind: 'number' }], rest: { kind: 'array', of: { kind: 'boolean' } } }, '[string, number, ...boolean[]]', '[string,number,...boolean[]]'],
            ['tuple with rest (min bound)', { kind: 'tuple', of: [{ kind: 'string' }, { kind: 'number' }], rest: { kind: 'array', of: { kind: 'boolean' }, min: 1 } }, '[string, number, ...boolean[>= 1]]', '[string,number,...boolean[>=1]]'],
            ['tuple with rest (max bound)', { kind: 'tuple', of: [{ kind: 'string' }, { kind: 'number' }], rest: { kind: 'array', of: { kind: 'boolean' }, max: 3 } }, '[string, number, ...boolean[<= 3]]', '[string,number,...boolean[<=3]]'],
            ['tuple with rest (exact bound)', { kind: 'tuple', of: [{ kind: 'string' }, { kind: 'number' }], rest: { kind: 'array', of: { kind: 'boolean' }, exact: 2 } }, '[string, number, ...boolean[= 2]]', '[string,number,...boolean[=2]]'],
            ['tuple with rest (min and max bound)', { kind: 'tuple', of: [{ kind: 'string' }, { kind: 'number' }], rest: { kind: 'array', of: { kind: 'boolean' }, min: 1, max: 3 } }, '[string, number, ...boolean[>= 1, <= 3]]', '[string,number,...boolean[>=1,<=3]]'],
            ['tuple with rest (exclusive min bound)', { kind: 'tuple', of: [{ kind: 'string' }, { kind: 'number' }], rest: { kind: 'array', of: { kind: 'boolean' }, xmin: 1 } }, '[string, number, ...boolean[> 1]]', '[string,number,...boolean[>1]]'],
            ['tuple with rest (exclusive max bound)', { kind: 'tuple', of: [{ kind: 'string' }, { kind: 'number' }], rest: { kind: 'array', of: { kind: 'boolean' }, xmax: 3 } }, '[string, number, ...boolean[< 3]]', '[string,number,...boolean[<3]]'],
            ['tuple with rest (exclusive min and max bound)', { kind: 'tuple', of: [{ kind: 'string' }, { kind: 'number' }], rest: { kind: 'array', of: { kind: 'boolean' }, xmin: 1, xmax: 3 } }, '[string, number, ...boolean[> 1, < 3]]', '[string,number,...boolean[>1,<3]]'],
        ];

        testCases.forEach(testStringify);
    });

    describe('RecordSchema', () => {
        const testCases: TestCase<RecordSchema>[] = [
            [
                'basic',
                { kind: 'record', of: { kind: 'string' } },
                'record<string>',
                'record<string>'
            ],
            [
                'with custom key',
                { kind: 'record', of: { kind: 'number' }, key: { kind: 'string', of: 'email' } },
                'record<email, number>',
                'record<email,number>'
            ],
            [
                'with min properties',
                { kind: 'record', of: { kind: 'boolean' }, min: 2 },
                'record<boolean>(>= 2)',
                'record<boolean>(>=2)'
            ],
            [
                'with max properties',
                { kind: 'record', of: { kind: 'string' }, max: 5 },
                'record<string>(<= 5)',
                'record<string>(<=5)'
            ],
            [
                'with min and max properties',
                { kind: 'record', of: { kind: 'number' }, min: 1, max: 10 },
                'record<number>(>= 1, <= 10)',
                'record<number>(>=1,<=10)'
            ],
            [
                'with exclusive min properties',
                { kind: 'record', of: { kind: 'integer' }, xmin: 0 },
                'record<integer>(> 0)',
                'record<integer>(>0)'
            ],
            [
                'with exclusive max properties',
                { kind: 'record', of: { kind: 'string' }, xmax: 100 },
                'record<string>(< 100)',
                'record<string>(<100)'
            ],
            [
                'with complex value type',
                { kind: 'record', of: { kind: 'array', of: { kind: 'string' } } },
                'record<string[]>',
                'record<string[]>'
            ],
            [
                'with complex key type',
                { kind: 'record', of: { kind: 'number' }, key: { kind: 'string', of: /^[A-Z]+$/, min: 3, max: 10 } },
                "record</^[A-Z]+$/(>= 3, <= 10), number>",
                "record</^[A-Z]+$/(>=3,<=10),number>"
            ],
        ];

        testCases.forEach(testStringify);
    });

    describe('UnionSchema', () => {
        const testCases: TestCase<UnionSchema>[] = [
            [
                'basic',
                { kind: 'union', of: [{ kind: 'string' }, { kind: 'number' }] },
                'string | number',
                'string|number'
            ],
            [
                'with multiple types',
                { kind: 'union', of: [{ kind: 'string' }, { kind: 'number' }, { kind: 'boolean' }] },
                'string | number | boolean',
                'string|number|boolean'
            ],
            [
                'with complex types',
                {
                    kind: 'union', of: [
                        { kind: 'string', of: 'email' },
                        { kind: 'array', of: { kind: 'number' } },
                        { kind: 'object', of: { foo: { kind: 'string' } } }
                    ]
                },
                'email | number[] | {\n  foo: string\n}',
                'email|number[]|{foo:string}'
            ],
            [
                'with nested unions',
                {
                    kind: 'union', of: [
                        { kind: 'string' },
                        { kind: 'union', of: [{ kind: 'number' }, { kind: 'boolean' }] }
                    ]
                },
                'string | number | boolean',
                'string|number|boolean'
            ],

        ];

        testCases.forEach(testStringify);


        // Additional test for Array of UnionSchema
        const testCase: TestCase<ArraySchema> = [
            'Array of UnionSchema',
            {
                kind: 'array',
                of: {
                    kind: 'union', of: [{ kind: 'string' }, { kind: 'number' }]
                }
            },
            '(string | number)[]',
            '(string|number)[]'
        ];

        testStringify(testCase);
    });

    describe('ObjectSchema', () => {
        const testCases: TestCase<ObjectSchema>[] = [
            [
                'basic object',
                { kind: 'object', of: { name: { kind: 'string' } } },
                '{\n  name: string\n}',
                '{name:string}'
            ],
            [
                'multiple properties',
                { kind: 'object', of: { name: { kind: 'string' }, age: { kind: 'integer' } } },
                '{\n  name: string,\n  age: integer\n}',
                '{name:string,age:integer}'
            ],
            [
                'optional properties',
                { kind: 'object', of: { name: { kind: 'string' }, age: { kind: 'integer', isOptional: true } } },
                '{\n  name: string,\n  age?: integer\n}',
                '{name:string,age?:integer}'
            ],
            [
                'nested objects',
                { kind: 'object', of: { person: { kind: 'object', of: { name: { kind: 'string' }, age: { kind: 'integer' } } } } },
                '{\n  person: {\n    name: string,\n    age: integer\n  }\n}',
                '{person:{name:string,age:integer}}'
            ]
        ];

        testCases.forEach(testStringify);
    });

    describe('ModelSchema', () => {
        const testCases: TestCase<ModelSchema>[] = [
            [
                'basic model',
                { kind: 'model', of: { name: { kind: 'string' } } },
                'model {\n  name: string\n}',
                'model{name:string}'
            ],
            [
                'multiple properties',
                { kind: 'model', of: { name: { kind: 'string' }, age: { kind: 'integer' } } },
                'model {\n  name: string,\n  age: integer\n}',
                'model{name:string,age:integer}'
            ],
            [
                'optional properties',
                { kind: 'model', of: { name: { kind: 'string' }, age: { kind: 'integer', isOptional: true } } },
                'model {\n  name: string,\n  age?: integer\n}',
                'model{name:string,age?:integer}'
            ],
            [
                'nested objects',
                { kind: 'model', of: { person: { kind: 'object', of: { name: { kind: 'string' }, age: { kind: 'integer' } } } } },
                'model {\n  person: {\n    name: string,\n    age: integer\n  }\n}',
                'model{person:{name:string,age:integer}}'
            ]
        ];

        testCases.forEach(testStringify);
    });

    describe('GroupSchema', () => {
        const testCases: TestCase<GroupSchema>[] = [
            [
                'basic group',
                { kind: 'group', of: { Person: { kind: 'object', of: { name: { kind: 'string' } } } } },
                'group {\n  Person: {\n    name: string\n  }\n}',
                'group{Person:{name:string}}'
            ],
            [
                'multiple schemas',
                { kind: 'group', of: { Person: { kind: 'object', of: { name: { kind: 'string' } } }, Age: { kind: 'integer' } } },
                'group {\n  Person: {\n    name: string\n  },\n  Age: integer\n}',
                'group{Person:{name:string},Age:integer}'
            ],
            [
                'with selected schema',
                { kind: 'group', of: { Person: { kind: 'object', of: { name: { kind: 'string' } } }, Age: { kind: 'integer' } }, selected: 'Person' },
                'select Person of group {\n  Person: {\n    name: string\n  },\n  Age: integer\n}',
                'select Person of group{Person:{name:string},Age:integer}'
            ],
            [
                'with optional properties',
                { kind: 'group', of: { Person: { kind: 'object', of: { name: { kind: 'string' }, age: { kind: 'integer' } } } }, isOptional: true },
                'group {\n  Person: {\n    name: string,\n    age: integer\n  }\n}',
                'group{Person:{name:string,age:integer}}'
            ]
        ];

        testCases.forEach(testStringify);
    });

    describe('RefSchema', () => {
        const testCases: TestCase<RefSchema>[] = [
            ['basic ref', { kind: 'ref', of: 'Person' }, 'Person', 'Person']
        ];

        testCases.forEach(testStringify);
    });

    describe('RootSchema', () => {
        const testCases: TestCase<RootSchema>[] = [
            ['basic root', { kind: 'root' }, 'root', 'root']
        ];

        testCases.forEach(testStringify);
    });

    describe('ThisSchema', () => {
        const testCases: TestCase<ThisSchema>[] = [
            ['basic this', { kind: 'this' }, 'this', 'this']
        ];

        testCases.forEach(testStringify);
    });
});