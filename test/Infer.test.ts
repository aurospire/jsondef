import {
    AnyField,
    BooleanField,
    IntegerField,
    NullField, NumberField,
    RecordField, RootField, StringField, ThisField
} from "@/Field";
import { InferField, InferObject, InferTuple } from '@/Infer';
import { expectType } from 'jestype';

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
            type TestField = { kind: 'array', of: StringField; };
            type T = InferField<TestField>;
            expectType<InferField<{ kind: 'array', of: StringField; }>>().toBe<string[]>();
        });

        it('should infer record type for RecordField', () => {
            type TestField = RecordField & { value: NumberField; };
            expectType<InferField<TestField>>().toBe<{ [key: string]: number; }>();
        });

        it('should infer object type for ModelField and ObjectField', () => {
            expectType<InferField<{ kind: 'model', of: { prop: StringField; }; }>>().toBe<{ prop: string; }>();
            expectType<InferField<{ kind: 'object', of: { prop: NumberField; }; }>>().toBe<{ prop: number; }>();
        });

        it('should infer combined type for CompositeField', () => {
            type TestField = {
                kind: 'composite';
                of: [
                    { kind: 'model', of: { a: StringField; }; },
                    { kind: 'object', of: { b: NumberField; }; }
                ];
            };

            expectType<InferField<TestField>>().toExtend<{ a: string; } & { b: number; }>();
        });

        it('should allow combining standalone Models', () => {
            type UserModel = {
                kind: 'model';
                of: {
                    id: NumberField;
                    name: StringField;
                };
            };

            type PostModel = {
                kind: 'model';
                of: {
                    id: NumberField;
                    title: StringField;
                    author: UserModel;
                };
            };

            type InferredPost = InferField<PostModel>;

            type Expected = {
                id: number;
                title: string;
                author: {
                    id: number;
                    name: string;
                };
            };

            expectType<InferredPost>().toBe<Expected>();
        });


        describe('Recursive Structures', () => {
            it('should test stand-alone this and root', () => {
                expectType<InferField<ThisField>>().toBe<undefined>();

                expectType<InferField<RootField>>().toBe<undefined>();
            });

            it('should test Object', () => {
                type Field = {
                    kind: 'object';
                    of: {
                        value: StringField;
                        root: { kind: 'root', optional: true; };
                        this: { kind: 'this', optional: true; };
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

            it('should test Model', () => {
                type Field = {
                    kind: 'model';
                    of: {
                        value: StringField;
                        root: { kind: 'root', optional: true; };
                        this: { kind: 'this', optional: true; };
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

            it('should test nested Object and Model', () => {
                type Field = {
                    kind: 'object';
                    of: {
                        value: StringField;
                        nestedObject: {
                            kind: 'object',
                            of: {
                                root: { kind: 'root'; optional: true; };
                                this: { kind: 'this'; optional: true; };
                            };
                        };

                        nestedModel: {
                            kind: 'model',
                            of: {
                                root: { kind: 'root'; optional: true; };
                                this: { kind: 'this'; optional: true; };
                            };
                        };
                    };
                };

                type Inferred = InferField<Field>;

                type NestedObject = {
                    root?: Expected;
                    this?: NestedObject;
                };

                type NestedModel = {
                    root?: NestedModel;
                    this?: NestedModel;
                };

                type Expected = {
                    value: string;
                    nestedObject: NestedObject;
                    nestedModel: NestedModel;
                };

                expectType<Inferred>().toBe<Expected>();
            });

            it('should allow combining standalone Models', () => {
                type UserModel = {
                    kind: 'model';
                    of: {
                        id: NumberField;
                        name: StringField;
                        root: { kind: 'root', optional: true; }; // models keep the root internal
                    };
                };

                type PostModel = {
                    kind: 'model';
                    of: {
                        id: NumberField;
                        title: StringField;
                        author: UserModel;
                    };
                };

                type InferredPost = InferField<PostModel>;


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


                expectType<InferredPost>().toBe<ExpectedPost>();
            });

        });
    });

    describe('InferObject', () => {
        it('should infer object structure correctly', () => {
            type TestFieldObject = {
                implicit: { kind: 'string'; };
                explicit: { kind: 'boolean'; optional: false; };
                optional: { kind: 'number'; optional: true; };
            };

            type Expected = {
                implicit: string;
                explicit: boolean;
                optional?: number;
            };

            expectType<InferObject<TestFieldObject>>().toBe<Expected>();
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

            type InferredObject = InferObject<TestFieldObject>;

            expectType<InferredObject>().toBe<{ nested: { prop: boolean; }; }>();
        });
    });

    describe('InferTuple', () => {
        it('should infer tuple structure correctly', () => {
            type TestTuple = [StringField, NumberField, BooleanField];

            type InferredTuple = InferTuple<TestTuple>;

            expectType<InferredTuple>().toBe<[string, number, boolean]>();
        });

        it('should handle rest element', () => {
            type TestTuple = [StringField, NumberField];
            type TestRest = BooleanField;

            type InferredTuple = InferTuple<TestTuple, undefined, undefined, TestRest>;

            expectType<InferredTuple>().toExtend<[string, number, ...boolean[]]>();
        });
    });
});