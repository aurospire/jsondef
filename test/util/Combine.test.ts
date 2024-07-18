import { Combine, UnionToIntersection } from '@/util/Combine';
import { expectType } from 'jestype';

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
