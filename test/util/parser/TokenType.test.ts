import { TokenType, tokenTypes, Flatten, TokenTypeEnum } from '@/util/parser/TokenType';
import { expectType } from 'jestype';

describe('TokenType', () => {
    describe('constructor', () => {
        it('should create a TokenType instance with correct mappings', () => {
            const tokenType = new TokenType(['A', ['B', 'C'], 'D']);

            expect(tokenType.id('A')).toBe(0);
            expect(tokenType.id('B')).toBe(1);
            expect(tokenType.id('C')).toBe(1);
            expect(tokenType.id('D')).toBe(2);

            expect(tokenType.names(0)).toEqual(['A']);
            expect(tokenType.names(1)).toEqual(['B', 'C']);
            expect(tokenType.names(2)).toEqual(['D']);
        });

        it('should throw an error for duplicate names', () => {
            expect(() => new TokenType(['A', ['B', 'A']])).toThrow('Name A already defined');
        });
    });

    describe('id method', () => {
        const tokenType = new TokenType(['A', ['B', 'C'], 'D']);

        it('should return correct id for existing names', () => {
            expect(tokenType.id('A')).toBe(0);
            expect(tokenType.id('B')).toBe(1);
            expect(tokenType.id('C')).toBe(1);
            expect(tokenType.id('D')).toBe(2);
        });

        it('should return -1 for non-existing names', () => {
            expect(tokenType.id('E' as any)).toBe(-1);
        });
    });

    describe('names method', () => {
        const tokenType = new TokenType(['A', ['B', 'C'], 'D']);

        it('should return correct names for existing ids', () => {
            expect(tokenType.names(0)).toEqual(['A']);
            expect(tokenType.names(1)).toEqual(['B', 'C']);
            expect(tokenType.names(2)).toEqual(['D']);
        });

        it('should return an empty array for non-existing ids', () => {
            expect(tokenType.names(3)).toEqual([]);
        });
    });

    describe('matches method', () => {
        const tokenType = new TokenType(['A', ['B', 'C'], 'D']);

        it('should return true for matching id and name', () => {
            expect(tokenType.matches(0, 'A')).toBe(true);
            expect(tokenType.matches(1, 'B')).toBe(true);
            expect(tokenType.matches(1, 'C')).toBe(true);
            expect(tokenType.matches(2, 'D')).toBe(true);
        });

        it('should return false for non-matching id and name', () => {
            expect(tokenType.matches(0, 'B')).toBe(false);
            expect(tokenType.matches(1, 'A')).toBe(false);
            expect(tokenType.matches(2, 'C')).toBe(false);
        });
    });

    describe('types getter', () => {
        it('should return an object with correct type mappings', () => {
            const tokenType = new TokenType(['A', ['B', 'C'], 'D']);
            expect(tokenType.types).toEqual({
                A: 0,
                B: 1,
                C: 1,
                D: 2
            });
        });
    });
});

describe('tokenTypes helper function', () => {
    it('should create a TokenType instance with correct type information', () => {
        const tokens = tokenTypes('A', ['B', 'C'], 'D');

        expect(tokens.A).toBe(0);
        expect(tokens.B).toBe(1);
        expect(tokens.C).toBe(1);
        expect(tokens.D).toBe(2);

        expect(tokens.id('A')).toBe(0);
        expect(tokens.names(1)).toEqual(['B', 'C']);
        expect(tokens.matches(2, 'D')).toBe(true);
    });
});

describe('Type tests', () => {
    it('should correctly flatten types', () => {
        type TestFlatten = Flatten<['A', ['B', 'C'], 'D']>;
        expectType<TestFlatten>().toBe<'A' | 'B' | 'C' | 'D'>();
    });

    it('should create correct TokenTypeEnum', () => {
        type TestTokenTypeEnum = TokenTypeEnum<['A', ['B', 'C'], 'D']>;
        expectType<TestTokenTypeEnum>().toBe<{
            A: number;
            B: number;
            C: number;
            D: number;
        }>();
    });
});