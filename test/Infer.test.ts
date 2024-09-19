import {
    AnySchema,
    BooleanSchema,
    IntegerSchema,
    NullSchema,
    NumberSchema,
    RootSchema,
    StringSchema,
    ThisSchema
} from "@/Schema";
import { InferSchema } from '@/Infer';
import { expectType } from 'jestype';

describe('InferSchema', () => {
    describe('Basic Schemas', () => {
        it('should infer correct types for basic schemas', () => {
            expectType<InferSchema<NullSchema>>().toBe<null>();
            expectType<InferSchema<AnySchema>>().toBe<any>();
            expectType<InferSchema<BooleanSchema>>().toBe<boolean>();
            expectType<InferSchema<IntegerSchema>>().toBe<number>();
            expectType<InferSchema<NumberSchema>>().toBe<number>();
            expectType<InferSchema<StringSchema>>().toBe<string>();
        });
    });

    describe('Literal Schemas', () => {
        it('should infer correct types for literal schemas', () => {
            expectType<InferSchema<{ kind: 'literal', of: true; }>>().toBe<true>();
            expectType<InferSchema<{ kind: 'literal', of: 42; }>>().toBe<42>();
            expectType<InferSchema<{ kind: 'literal', of: 'test'; }>>().toBe<'test'>();
        });
    });

    describe('Array Schemas', () => {
        it('should infer correct types for array schemas', () => {
            type StringArraySchema = { kind: 'array', of: StringSchema; };
            expectType<InferSchema<StringArraySchema>>().toBe<string[]>();

            type NestedArraySchema = { kind: 'array', of: { kind: 'array', of: NumberSchema; }; };
            expectType<InferSchema<NestedArraySchema>>().toBe<number[][]>();
        });
    });

    describe('Record Schemas', () => {
        it('should infer correct types for record schemas', () => {
            type StringRecordSchema = { kind: 'record', of: StringSchema; };
            expectType<InferSchema<StringRecordSchema>>().toBe<{ [key: string]: string; }>();
        });
    });

    describe('Model and Object Schemas', () => {
        it('should infer correct types for model schemas', () => {
            type UserModel = {
                kind: 'model',
                of: {
                    id: NumberSchema;
                    name: StringSchema;
                };
                name: 'User';
            };
            expectType<InferSchema<UserModel>>().toBe<{ id: number; name: string; }>();
        });

        it('should infer correct types for object schemas', () => {
            type AddressObject = {
                kind: 'object',
                of: {
                    street: StringSchema;
                    city: StringSchema;
                    zipCode: NumberSchema;
                };
            };
            expectType<InferSchema<AddressObject>>().toBe<{ street: string; city: string; zipCode: number; }>();
        });
    });

    describe('Union Schemas', () => {
        it('should infer correct types for union schemas', () => {
            type StringOrNumberSchema = {
                kind: 'union',
                of: [StringSchema, NumberSchema];
            };
            expectType<InferSchema<StringOrNumberSchema>>().toBe<string | number>();
        });
    });

    describe('Tuple Schemas', () => {
        it('should infer correct types for tuple schemas', () => {
            type MixedTupleSchema = {
                kind: 'tuple',
                of: [StringSchema, NumberSchema, BooleanSchema];
            };
            type Inferred = InferSchema<MixedTupleSchema>;
            expectType<Inferred>().toBe<[string, number, boolean]>();
        });

        it('should handle rest elements in tuples', () => {
            type RestTupleSchema = {
                kind: 'tuple',
                of: [StringSchema, NumberSchema];
                rest: BooleanSchema;
            };
            type InferredRestTuple = InferSchema<RestTupleSchema>;
            expectType<InferredRestTuple>().toExtend<[string, number, ...boolean[]]>();
        });
    });

    describe('Reference Schemas', () => {
        it('should infer correct types for ref schemas', () => {
            type TestGroup = {
                User: {
                    kind: 'model',
                    of: {
                        id: NumberSchema;
                        name: StringSchema;
                    };
                    name: 'User';
                };
                Post: {
                    kind: 'model',
                    of: {
                        id: NumberSchema;
                        title: StringSchema;
                        author: { kind: 'ref', of: 'User'; };
                    };
                    name: 'Post';
                };
            };

            type InferredPost = InferSchema<TestGroup['Post'], TestGroup>;
            type ExpectedPost = {
                id: number;
                title: string;
                author: {
                    id: number;
                    name: string;
                };
            };
            expectType<InferredPost>().toBe<ExpectedPost>();
        });
    });

    describe('Recursive Structures', () => {
        it('should handle this and root schemas', () => {
            type RecursiveSchema = {
                kind: 'object',
                of: {
                    value: StringSchema;
                    root: RootSchema & { isOptional: true; };
                    this: ThisSchema & { isOptional: true; };
                };
            };
            type InferredRecursive = InferSchema<RecursiveSchema>;
            type ExpectedRecursive = {
                value: string;
                root?: ExpectedRecursive;
                this?: ExpectedRecursive;
            };
            expectType<InferredRecursive>().toBe<ExpectedRecursive>();
        });

        it('should handle circular references', () => {
            type TreeNodeGroup = {
                TreeNode: {
                    kind: 'object',
                    of: {
                        value: NumberSchema;
                        left: { kind: 'ref', of: 'TreeNode'; isOptional: true; };
                        right: { kind: 'ref', of: 'TreeNode'; isOptional: true; };
                    };
                };
            };

            type InferredTreeNode = InferSchema<TreeNodeGroup['TreeNode'], TreeNodeGroup>;
            type ExpectedTreeNode = {
                value: number;
                left?: ExpectedTreeNode;
                right?: ExpectedTreeNode;
            };
            expectType<InferredTreeNode>().toBe<ExpectedTreeNode>();
        });
    });

    describe('Group Schemas', () => {
        it('should infer correct types for group schemas', () => {
            type TestGroup = {
                kind: 'group',
                of: {
                    User: {
                        kind: 'model',
                        of: {
                            id: NumberSchema;
                            name: StringSchema;
                        };
                        name: 'User';
                    };
                    Post: {
                        kind: 'model',
                        of: {
                            id: NumberSchema;
                            title: StringSchema;
                            author: { kind: 'ref', of: 'User'; };
                        };
                        name: 'Post';
                    };
                };
            };

            type InferredGroup = InferSchema<TestGroup>;
            type ExpectedGroup = {
                User: {
                    id: number;
                    name: string;
                };
                Post: {
                    id: number;
                    title: string;
                    author: {
                        id: number;
                        name: string;
                    };
                };
            };
            expectType<InferredGroup>().toBe<ExpectedGroup>();
        });

        it('should infer correct types for group schemas with main', () => {
            type TestGroup = {
                kind: 'group',
                selected: 'Post',
                of: {
                    User: {
                        kind: 'model',
                        of: {
                            id: NumberSchema;
                            name: StringSchema;
                        };
                        name: 'User';
                    };
                    Post: {
                        kind: 'model',
                        of: {
                            id: NumberSchema;
                            title: StringSchema;
                            author: { kind: 'ref', of: 'User'; };
                        };
                        name: 'Post';
                    };
                };
            };

            type InferredGroup = InferSchema<TestGroup>;

            type ExpectedGroup = {
                id: number;
                title: string;
                author: {
                    id: number;
                    name: string;
                };
            };

            expectType<InferredGroup>().toBe<ExpectedGroup>();
        });

        it('should infer correct types for group schemas with invalid selected', () => {
            type TestGroup = {
                kind: 'group',
                selected: 'Address',
                of: {
                    User: {
                        kind: 'model',
                        of: {
                            id: NumberSchema;
                            name: StringSchema;
                        };
                        name: 'User';
                    };
                    Post: {
                        kind: 'model',
                        of: {
                            id: NumberSchema;
                            title: StringSchema;
                            author: { kind: 'ref', of: 'User'; };
                        };
                        name: 'Post';
                    };
                };
            };

            type InferredGroup = InferSchema<TestGroup>;
            type ExpectedGroup = never;
            expectType<InferredGroup>().toBe<ExpectedGroup>();
        });
    });

    it('should infer correct types for group schemas with generic selected', () => {
        type TestGroup = {
            kind: 'group',
            selected: string,
            of: {
                User: {
                    kind: 'model',
                    of: {
                        id: NumberSchema;
                        name: StringSchema;
                    };
                    name: 'User';
                };
                Post: {
                    kind: 'model',
                    of: {
                        id: NumberSchema;
                        title: StringSchema;
                        author: { kind: 'ref', of: 'User'; };
                    };
                    name: 'Post';
                };
            };
        };

        type InferredGroup = InferSchema<TestGroup>;
        type ExpectedGroup = never;
        expectType<InferredGroup>().toBe<ExpectedGroup>();
    });

    it('should infer correct types for group schemas with multiple selected', () => {
        type TestGroup = {
            kind: 'group',
            selected: 'User' | 'Post',
            of: {
                User: {
                    kind: 'model',
                    of: {
                        id: NumberSchema;
                        name: StringSchema;
                    };
                    name: 'User';
                };
                Post: {
                    kind: 'model',
                    of: {
                        id: NumberSchema;
                        title: StringSchema;
                        author: { kind: 'ref', of: 'User'; };
                    };
                    name: 'Post';
                };
            };
        };

        type InferredGroup = InferSchema<TestGroup>;
        type ExpectedGroup = {
            id: number;
            name: string;
        } | {
            id: number;
            title: string;
            author: {
                id: number;
                name: string;
            };
        };

        expectType<InferredGroup>().toBe<ExpectedGroup>();
    });
});