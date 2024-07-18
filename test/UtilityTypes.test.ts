import { expectType } from 'jestype';
import { OneOrMore, Combine, UnionToIntersection } from '@/UtilityTypes';

describe('UtilityType', () => {
    describe('OneOrMore<T>', () => {
        it('should allow a single instance of T', () => {
            expectType<OneOrMore<number>>().toBePartOf<number>();
        });

        it('should allow an array of T', () => {
            expectType<OneOrMore<string>>().toBePartOf<string[]>();
        });

        it('should not allow other types', () => {
            expectType<OneOrMore<boolean>>().not.toBePartOf<string>();
            expectType<OneOrMore<boolean>>().not.toBePartOf<number[]>();
        });

        it('should work with complex types', () => {
            type Complex = {
                id: number;
                name: string;
            };

            expectType<OneOrMore<Complex>>().toBePartOf<Complex>();
            expectType<OneOrMore<Complex>>().toBePartOf<Complex[]>();
        });
    });

    describe('Combine<T, K>', () => {
        it('should combine types at numeric keys of a tuple', () => {
            type Tuple = [{ a: string; }, { b: number; }, { c: boolean; }];

            expectType<Combine<Tuple, 0 | 1 | 2>>().toBe<{ a: string; } & { b: number; } & { c: boolean; }>();
        });

        it('should work with partial combinations', () => {
            type Tuple = [{ a: string; }, { b: number; }, { c: boolean; }];

            expectType<Combine<Tuple, 0 | 1>>().toBe<{ a: string; } & { b: number; }>();
        });

        it('should work with arrays', () => {
            type Arr = ({ id: number; } | { name: string; })[];

            expectType<Combine<Arr, number>>().toBe<{ id: number; } & { name: string; }>();
        });
    });

    describe('UnionToIntersection<U>', () => {
        it('should convert a simple union to an intersection', () => {
            type Union = { a: string; } | { b: number; };

            expectType<UnionToIntersection<Union>>().toBe<{ a: string; } & { b: number; }>();
        });

        it('should handle multiple union members', () => {
            type Union = { a: string; } | { b: number; } | { c: boolean; };

            expectType<UnionToIntersection<Union>>().toBe<{ a: string; } & { b: number; } & { c: boolean; }>();
        });

        it('should work with function types', () => {
            type Union = ((a: string) => void) | ((b: number) => void);
            expectType<UnionToIntersection<Union>>().toBe<((a: string) => void) & ((b: number) => void)>();
        });
    });
});