import {
    AnyField,
    BooleanField,
    IntegerField,
    NullField, NumberField,
    StringField
} from "@/Field";
import { InferField, InferNamespace, InferObject, InferTuple } from '@/Infer';
import { expectType } from 'jestype';
import { RootField, ThisField } from "types";

describe('Infer Types', () => {
    describe('InferField', () => {
        it('should infer null for NullField', () => {
            expectType<InferField<NullField>>().toBe<null>();
        });

        it('should infer any for AnyField', () => {
            expectType<InferField<AnyField>>().toBe<any>();
        });

        it('should infer boolean for BooleanField', () => {
            expectType<InferField<BooleanField>>().toBe<boolean>();
        });

        it('should infer number for IntegerField and NumberField', () => {
            expectType<InferField<IntegerField>>().toBe<number>();
            expectType<InferField<NumberField>>().toBe<number>();
        });

        it('should infer string for StringField', () => {
            expectType<InferField<StringField>>().toBe<string>();
        });

        it('should infer literal type for LiteralField', () => {
            expectType<InferField<{ kind: 'literal', of: true; }>>().toBe<true>();
            expectType<InferField<{ kind: 'literal', of: false; }>>().toBe<false>();
            expectType<InferField<{ kind: 'literal', of: -10; }>>().toBe<-10>();
            expectType<InferField<{ kind: 'literal', of: 'test'; }>>().toBe<'test'>();
        });

        it('should infer array type for ArrayField', () => {
            expectType<InferField<{ kind: 'array', of: StringField; }>>().toBe<string[]>();
        });

        it('should infer record type for RecordField', () => {
            type TestField = { kind: 'record'; of: NumberField; };
            expectType<InferField<TestField>>().toBe<{ [key: string]: number; }>();
        });

        it('should infer object type for ModelField and ObjectField', () => {
            expectType<InferField<{ kind: 'model', name: 'Model', of: { prop: StringField; }; }>>().toBe<{ prop: string; }>();
            expectType<InferField<{ kind: 'object', of: { prop: NumberField; }; }>>().toBe<{ prop: number; }>();
        });

        it('should infer combined type for CompositeField', () => {
            type TestField = {
                kind: 'composite';
                of: [
                    { kind: 'model', name: 'Model', of: { a: StringField; }; },
                    { kind: 'object', of: { b: NumberField; }; },
                    { kind: 'record'; of: BooleanField; }
                ];
            };

            type Inferrred = InferField<TestField>;

            // This type actually doesnt work for any values - but the still gets created
            expectType<Inferrred>().toExtend<{ a: string; } & { b: number; } & { [key: string]: boolean; }>();
        });

        it('should infer union type for UnionField', () => {
            type TestUnionField = {
                kind: 'union',
                of: [{ kind: 'literal', of: 42; }, { kind: 'literal', of: 'hello'; }];
            };
            expectType<InferField<TestUnionField>>().toBe<42 | 'hello'>();

            type ComplexUnion = {
                kind: 'union',
                of: [
                    { kind: 'model', name: 'Model', of: { id: IntegerField; }; },
                    { kind: 'object', of: { name: StringField; }; }
                ];
            };
            expectType<InferField<ComplexUnion>>().toBe<{ id: number; } | { name: string; }>();
        });

        describe('InferTuple', () => {
            it('should infer tuple structure correctly', () => {
                type TestTuple = [StringField, NumberField, BooleanField];
                expectType<InferTuple<TestTuple>>().toBe<[string, number, boolean]>();
            });

            it('should handle rest element in tuples', () => {
                type TestTuple = [StringField, NumberField];
                type TestRest = BooleanField;
                expectType<InferTuple<TestTuple, {}, undefined, undefined, TestRest>>().toExtend<[string, number, ...boolean[]]>();
            });
        });

        describe('InferObject', () => {
            it('should infer object structure correctly', () => {
                type TestFieldObject = {
                    implicit: { kind: 'string'; };
                    explicit: { kind: 'boolean'; isOptional: false; };
                    optional: { kind: 'number'; isOptional: true; };
                };
                type Inferred = InferObject<TestFieldObject>;

                type Expected = {
                    implicit: string;
                    explicit: boolean;
                    optional?: number;
                };

                expectType<Inferred>().toBe<Expected>();
            });

            it('should handle nested objects', () => {
                type TestFieldObject = {
                    nested: {
                        kind: 'object';
                        of: {
                            prop: BooleanField;
                        };
                    };
                };
                expectType<InferObject<TestFieldObject>>().toBe<{ nested: { prop: boolean; }; }>();
            });
        });


        describe('Recursive Structures', () => {
            it('should test stand-alone this and root', () => {
                expectType<InferField<ThisField>>().toBe<undefined>();

                expectType<InferField<RootField>>().toBe<undefined>();
            });

            it('should handle recursive references in Object and Model fields', () => {
                type Field = {
                    kind: 'object';
                    of: {
                        value: StringField;
                        root: { kind: 'root', isOptional: true; };
                        this: { kind: 'this', isOptional: true; };
                    };
                };

                type Inferred = InferField<Field>;

                type Expected = {
                    value: string;
                    root?: Expected;
                    this?: Expected;
                };

                expectType<Inferred>().toBe<Expected>();
            });

            it('should handle standalone Models with nested references', () => {
                type UserModel = {
                    kind: 'model';
                    name: 'User';
                    of: {
                        id: NumberField;
                        name: StringField;
                        root: { kind: 'root', isOptional: true; }; // models keep the root internal
                    };
                };

                type PostModel = {
                    kind: 'model';
                    name: 'Post';
                    of: {
                        id: NumberField;
                        title: StringField;
                        author: UserModel;
                    };
                };

                type ExpectedUser = {
                    id: number;
                    name: string;
                    root?: ExpectedUser;
                };

                type ExpectedPost = {
                    id: number;
                    title: string;
                    author: ExpectedUser;
                };

                type InferredPost = InferField<PostModel>;

                expectType<InferredPost>().toBe<ExpectedPost>();
            });
        });


        describe('RefField', () => {
            it('should infer the correct type for RefField', () => {
                type TestNamespace = {
                    User: {
                        kind: 'object';
                        of: {
                            id: NumberField;
                            name: StringField;
                        };
                    };
                    Post: {
                        kind: 'object';
                        of: {
                            id: NumberField;
                            title: StringField;
                            author: { kind: 'ref', of: 'User'; };
                        };
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

            it('should handle circular references', () => {
                type TestNamespace = {
                    TreeNode: {
                        kind: 'object';
                        of: {
                            value: NumberField;
                            left: { kind: 'ref', of: 'TreeNode', isOptional: true; };
                            right: { kind: 'ref', of: 'TreeNode', isOptional: true; };
                        };
                    };
                };

                type InferredTreeNode = InferField<TestNamespace['TreeNode'], TestNamespace>;

                type ExpectedTreeNode = {
                    value: number;
                    left?: ExpectedTreeNode;
                    right?: ExpectedTreeNode;
                };

                expectType<InferredTreeNode>().toBe<ExpectedTreeNode>();
            });
        });
    });

    describe('InferNamespace', () => {
        it('should infer all types in a namespace correctly', () => {
            type TestNamespace = {
                User: {
                    kind: 'object';
                    of: {
                        id: NumberField;
                        name: StringField;
                    };
                };
                Post: {
                    kind: 'object';
                    of: {
                        id: NumberField;
                        title: StringField;
                        author: { kind: 'ref', of: 'User' };
                    };
                };
            };

            type InferredNamespace = InferNamespace<TestNamespace>;

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

        it('should handle complex nested structures in a namespace', () => {
            type TestNamespace = {
                SimpleType: StringField;
                ComplexType: {
                    kind: 'object';
                    of: {
                        field1: NumberField;
                        field2: {
                            kind: 'array';
                            of: { kind: 'ref', of: 'SimpleType' };
                        };
                        field3: { kind: 'ref', of: 'NestedType' };
                    };
                };
                NestedType: {
                    kind: 'object';
                    of: {
                        nestedField: BooleanField;
                    };
                };
            };

            type InferredNamespace = InferNamespace<TestNamespace>;

            type ExpectedNamespace = {
                SimpleType: string;
                ComplexType: {
                    field1: number;
                    field2: string[];
                    field3: {
                        nestedField: boolean;
                    };
                };
                NestedType: {
                    nestedField: boolean;
                };
            };

            expectType<InferredNamespace>().toBe<ExpectedNamespace>();
        });
    });
});