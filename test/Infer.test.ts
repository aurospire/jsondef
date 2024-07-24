import {
    AnyField,
    BooleanField,
    IntegerField,
    NullField,
    NumberField,
    RootField,
    StringField,
    ThisField
} from "@/Field";
import { InferField } from '@/Infer';
import { expectType } from 'jestype';

describe('InferField', () => {
    describe('Basic Fields', () => {
        it('should infer correct types for basic fields', () => {
            expectType<InferField<NullField>>().toBe<null>();
            expectType<InferField<AnyField>>().toBe<any>();
            expectType<InferField<BooleanField>>().toBe<boolean>();
            expectType<InferField<IntegerField>>().toBe<number>();
            expectType<InferField<NumberField>>().toBe<number>();
            expectType<InferField<StringField>>().toBe<string>();
        });
    });

    describe('Literal Fields', () => {
        it('should infer correct types for literal fields', () => {
            expectType<InferField<{ kind: 'literal', of: true; }>>().toBe<true>();
            expectType<InferField<{ kind: 'literal', of: 42; }>>().toBe<42>();
            expectType<InferField<{ kind: 'literal', of: 'test'; }>>().toBe<'test'>();
        });
    });

    describe('Array Fields', () => {
        it('should infer correct types for array fields', () => {
            type StringArrayField = { kind: 'array', of: StringField; };
            expectType<InferField<StringArrayField>>().toBe<string[]>();

            type NestedArrayField = { kind: 'array', of: { kind: 'array', of: NumberField; }; };
            expectType<InferField<NestedArrayField>>().toBe<number[][]>();
        });
    });

    describe('Record Fields', () => {
        it('should infer correct types for record fields', () => {
            type StringRecordField = { kind: 'record', of: StringField; };
            expectType<InferField<StringRecordField>>().toBe<{ [key: string]: string; }>();
        });
    });

    describe('Model and Object Fields', () => {
        it('should infer correct types for model fields', () => {
            type UserModel = {
                kind: 'model',
                of: {
                    id: NumberField;
                    name: StringField;
                };
                name: 'User';
            };
            expectType<InferField<UserModel>>().toBe<{ id: number; name: string; }>();
        });

        it('should infer correct types for object fields', () => {
            type AddressObject = {
                kind: 'object',
                of: {
                    street: StringField;
                    city: StringField;
                    zipCode: NumberField;
                };
            };
            expectType<InferField<AddressObject>>().toBe<{ street: string; city: string; zipCode: number; }>();
        });
    });

    describe('Union Fields', () => {
        it('should infer correct types for union fields', () => {
            type StringOrNumberField = {
                kind: 'union',
                of: [StringField, NumberField];
            };
            expectType<InferField<StringOrNumberField>>().toBe<string | number>();
        });
    });

    describe('Tuple Fields', () => {
        it('should infer correct types for tuple fields', () => {
            type MixedTupleField = {
                kind: 'tuple',
                of: [StringField, NumberField, BooleanField];
            };
            type Inferred = InferField<MixedTupleField>;
            expectType<Inferred>().toBe<[string, number, boolean]>();
        });

        it('should handle rest elements in tuples', () => {
            type RestTupleField = {
                kind: 'tuple',
                of: [StringField, NumberField];
                rest: BooleanField;
            };
            type InferredRestTuple = InferField<RestTupleField>;
            expectType<InferredRestTuple>().toExtend<[string, number, ...boolean[]]>();
        });
    });

    describe('Composite Fields', () => {
        it('should infer correct types for composite fields', () => {
            type CompositeAddressField = {
                kind: 'composite',
                of: [
                    { kind: 'model', name: 'Address'; of: { street: StringField; }; },
                    { kind: 'object', of: { city: StringField; }; },
                    { kind: 'record', of: StringField; }
                ];
            };
            type InferredComposite = InferField<CompositeAddressField>;
            expectType<InferredComposite>().toExtend<
                { street: string; } & { city: string; } & { [key: string]: string; }
            >();
        });
    });

    describe('Reference Fields', () => {
        it('should infer correct types for ref fields', () => {
            type TestNamespace = {
                User: {
                    kind: 'model',
                    of: {
                        id: NumberField;
                        name: StringField;
                    };
                    name: 'User';
                };
                Post: {
                    kind: 'model',
                    of: {
                        id: NumberField;
                        title: StringField;
                        author: { kind: 'ref', of: 'User'; };
                    };
                    name: 'Post';
                };
            };

            type InferredPost = InferField<TestNamespace['Post'], TestNamespace>;
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
        it('should handle this and root fields', () => {
            type RecursiveField = {
                kind: 'object',
                of: {
                    value: StringField;
                    root: RootField & { isOptional: true; };
                    this: ThisField & { isOptional: true; };
                };
            };
            type InferredRecursive = InferField<RecursiveField>;
            type ExpectedRecursive = {
                value: string;
                root?: ExpectedRecursive;
                this?: ExpectedRecursive;
            };
            expectType<InferredRecursive>().toBe<ExpectedRecursive>();
        });

        it('should handle circular references', () => {
            type TreeNodeNamespace = {
                TreeNode: {
                    kind: 'object',
                    of: {
                        value: NumberField;
                        left: { kind: 'ref', of: 'TreeNode'; isOptional: true; };
                        right: { kind: 'ref', of: 'TreeNode'; isOptional: true; };
                    };
                };
            };

            type InferredTreeNode = InferField<TreeNodeNamespace['TreeNode'], TreeNodeNamespace>;
            type ExpectedTreeNode = {
                value: number;
                left?: ExpectedTreeNode;
                right?: ExpectedTreeNode;
            };
            expectType<InferredTreeNode>().toBe<ExpectedTreeNode>();
        });
    });

    describe('Namespace Fields', () => {
        it('should infer correct types for namespace fields', () => {
            type TestNamespace = {
                kind: 'namespace',
                of: {
                    User: {
                        kind: 'model',
                        of: {
                            id: NumberField;
                            name: StringField;
                        };
                        name: 'User';
                    };
                    Post: {
                        kind: 'model',
                        of: {
                            id: NumberField;
                            title: StringField;
                            author: { kind: 'ref', of: 'User'; };
                        };
                        name: 'Post';
                    };
                };
            };

            type InferredNamespace = InferField<TestNamespace>;
            type ExpectedNamespace = {
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
            expectType<InferredNamespace>().toBe<ExpectedNamespace>();
        });

        it('should infer correct types for namespace fields with main', () => {
            type TestNamespace = {
                kind: 'namespace',
                mainKey: 'Post',
                of: {
                    User: {
                        kind: 'model',
                        of: {
                            id: NumberField;
                            name: StringField;
                        };
                        name: 'User';
                    };
                    Post: {
                        kind: 'model',
                        of: {
                            id: NumberField;
                            title: StringField;
                            author: { kind: 'ref', of: 'User'; };
                        };
                        name: 'Post';
                    };
                };
            };

            type InferredNamespace = InferField<TestNamespace>;

            type ExpectedNamespace = {
                id: number;
                title: string;
                author: {
                    id: number;
                    name: string;
                };
            };

            expectType<InferredNamespace>().toBe<ExpectedNamespace>();
        });

        it('should infer correct types for namespace fields with invalid mainKey', () => {
            type TestNamespace = {
                kind: 'namespace',
                mainKey: 'Address',
                of: {
                    User: {
                        kind: 'model',
                        of: {
                            id: NumberField;
                            name: StringField;
                        };
                        name: 'User';
                    };
                    Post: {
                        kind: 'model',
                        of: {
                            id: NumberField;
                            title: StringField;
                            author: { kind: 'ref', of: 'User'; };
                        };
                        name: 'Post';
                    };
                };
            };

            type InferredNamespace = InferField<TestNamespace>;
            type ExpectedNamespace = never;
            expectType<InferredNamespace>().toBe<ExpectedNamespace>();
        });
    });

    it('should infer correct types for namespace fields with generic mainKey', () => {
        type TestNamespace = {
            kind: 'namespace',
            mainKey: string,
            of: {
                User: {
                    kind: 'model',
                    of: {
                        id: NumberField;
                        name: StringField;
                    };
                    name: 'User';
                };
                Post: {
                    kind: 'model',
                    of: {
                        id: NumberField;
                        title: StringField;
                        author: { kind: 'ref', of: 'User'; };
                    };
                    name: 'Post';
                };
            };
        };

        type InferredNamespace = InferField<TestNamespace>;
        type ExpectedNamespace = never;
        expectType<InferredNamespace>().toBe<ExpectedNamespace>();
    });

    it('should infer correct types for namespace fields with multiple mainKey', () => {
        type TestNamespace = {
            kind: 'namespace',
            mainKey: 'User' | 'Post',
            of: {
                User: {
                    kind: 'model',
                    of: {
                        id: NumberField;
                        name: StringField;
                    };
                    name: 'User';
                };
                Post: {
                    kind: 'model',
                    of: {
                        id: NumberField;
                        title: StringField;
                        author: { kind: 'ref', of: 'User'; };
                    };
                    name: 'Post';
                };
            };
        };

        type InferredNamespace = InferField<TestNamespace>;
        type ExpectedNamespace = {
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

        expectType<InferredNamespace>().toBe<ExpectedNamespace>();
    });
});