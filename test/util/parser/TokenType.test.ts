import { TokenType } from '@/util/parser/TokenType';

describe('TokenType', () => {
    describe('with simple string array', () => {
        const tokenType = new TokenType(['a', 'b', 'c']);

        test('find should return correct ids', () => {
            expect(tokenType.find('a')).toBe(0);
            expect(tokenType.find('b')).toBe(1);
            expect(tokenType.find('c')).toBe(2);
            // @ts-expect-error
            expect(tokenType.find('d')).toBe(-1);
        });

        test('names should return correct names', () => {
            expect(tokenType.names(0)).toEqual(['a']);
            expect(tokenType.names(1)).toEqual(['b']);
            expect(tokenType.names(2)).toEqual(['c']);
            expect(tokenType.names(3)).toEqual([]);
        });

        test('matches should return correct boolean', () => {
            expect(tokenType.matches(0, 'a')).toBe(true);
            expect(tokenType.matches(1, 'b')).toBe(true);
            expect(tokenType.matches(0, 'b')).toBe(false);
            expect(tokenType.matches(3, 'c')).toBe(false);
        });
    });

    describe('with mixed string and string array', () => {
        const tokenType = new TokenType(['a', ['b', 'B'], 'c', ['d', 'D', 'delta']]);

        test('find should return correct ids for all variants', () => {
            expect(tokenType.find('a')).toBe(0);
            expect(tokenType.find('b')).toBe(1);
            expect(tokenType.find('B')).toBe(1);
            expect(tokenType.find('c')).toBe(2);
            expect(tokenType.find('d')).toBe(3);
            expect(tokenType.find('D')).toBe(3);
            expect(tokenType.find('delta')).toBe(3);
            // @ts-expect-error
            expect(tokenType.find('e')).toBe(-1);
        });

        test('names should return correct names including arrays', () => {
            expect(tokenType.names(0)).toEqual(['a']);
            expect(tokenType.names(1)).toEqual(['b', 'B']);
            expect(tokenType.names(2)).toEqual(['c']);
            expect(tokenType.names(3)).toEqual(['d', 'D', 'delta']);
            expect(tokenType.names(4)).toEqual([]);
        });

        test('matches should return correct boolean for all variants', () => {
            expect(tokenType.matches(0, 'a')).toBe(true);
            expect(tokenType.matches(1, 'b')).toBe(true);
            expect(tokenType.matches(1, 'B')).toBe(true);
            expect(tokenType.matches(2, 'c')).toBe(true);
            expect(tokenType.matches(3, 'd')).toBe(true);
            expect(tokenType.matches(3, 'D')).toBe(true);
            expect(tokenType.matches(3, 'delta')).toBe(true);
            expect(tokenType.matches(0, 'b')).toBe(false);
            expect(tokenType.matches(1, 'c')).toBe(false);
            expect(tokenType.matches(4, 'd')).toBe(false);
        });
    });

    describe('edge cases', () => {
        const tokenType = new TokenType([]);

        test('empty constructor should not throw', () => {
            expect(() => new TokenType([])).not.toThrow();
        });

        test('find should return -1 for any input on empty TokenType', () => {
            // @ts-expect-error
            expect(tokenType.find('any' as any)).toBe(-1);
        });

        test('names should return empty array for any input on empty TokenType', () => {
            expect(tokenType.names(0)).toEqual([]);
            expect(tokenType.names(100)).toEqual([]);
        });

        test('matches should return false for any input on empty TokenType', () => {
            // @ts-expect-error
            expect(tokenType.matches(0, 'any')).toBe(false);
            // @ts-expect-error
            expect(tokenType.matches(100, 'any')).toBe(false);
        });
    });
});