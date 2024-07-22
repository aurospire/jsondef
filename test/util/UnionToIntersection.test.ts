import {  UnionToIntersection } from '@/util/UnionToIntersection';
import { expectType } from 'jestype';

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
