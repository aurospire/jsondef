import { Scanner, Mark, Contains, StringScanner, Token, TokenScanner } from '@/util/scanner';

describe('NumberScanner', () => {
    class NumberScanner extends Scanner<number, number[], number> {
        constructor(data: number[] | NumberScanner) { super(data); }

        protected override initialMark(): Mark { return { position: 0 }; }

        protected override onConsume(data: number[], mark: Mark, count: number): void { mark.position += count; }

        protected override comparable(value: number | undefined): number { return value as number; }

        override clone(): NumberScanner { return new NumberScanner(this); }
    }

    describe('Basic Functionality', () => {
        it('should initialize with correct state', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            expect(scanner.position).toBe(0);
            expect(scanner.isEnd).toBe(false);
        });

        it('should peek correctly', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            expect(scanner.peek()).toBe(1);
            expect(scanner.peek(-1)).toBe(undefined);
            expect(scanner.peek(0)).toBe(1);
            expect(scanner.peek(1)).toBe(2);
            expect(scanner.peek(2)).toBe(3);
            expect(scanner.peek(3)).toBe(4);
            expect(scanner.peek(4)).toBe(5);
            expect(scanner.peek(5)).toBeUndefined();
        });

        it('should consume correctly', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            scanner.consume(2);
            expect(scanner.position).toBe(2);
            expect(scanner.peek()).toBe(3);
        });

        it('should handle end of data', () => {
            const scanner = new NumberScanner([1, 2, 3]);
            scanner.consume(3);
            expect(scanner.isEnd).toBe(true);
            expect(scanner.peek()).toBeUndefined();
        });
    });

    describe('Marking and Rollback', () => {
        it('should mark and commit correctly', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            scanner.mark();
            scanner.consume(2);
            scanner.commit();
            expect(scanner.position).toBe(2);
        });

        it('should mark and rollback correctly', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            scanner.mark();
            scanner.consume(2);
            scanner.rollback();
            expect(scanner.position).toBe(0);
        });

        it('should handle nested marking', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            scanner.mark();
            scanner.consume(2);
            scanner.mark();
            scanner.consume(2);
            scanner.rollback();
            expect(scanner.position).toBe(2);
            scanner.commit();
            expect(scanner.position).toBe(2);
        });

        it('should commit without marks', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            scanner.consume(2);
            scanner.commit();
            expect(scanner.position).toBe(2);
        });

        it('should rollback without marks', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            scanner.consume(2);
            scanner.rollback();
            expect(scanner.position).toBe(0);
            scanner.rollback();
            expect(scanner.position).toBe(0);
        });
    });

    describe('Data Extraction', () => {
        it('should capture correctly with no mark', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            scanner.consume(3);
            expect(scanner.captured()).toEqual([1, 2, 3]);
        });

        it('should capture correctly with mark', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            scanner.consume();
            scanner.mark();
            scanner.consume(3);
            expect(scanner.captured()).toEqual([2, 3, 4]);
        });

        it('should extract correctly with no mark', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            scanner.consume(3);
            const segment = scanner.extract();
            expect(segment.value).toEqual([1, 2, 3]);
            expect(segment.mark.position).toBe(0);
            expect(segment.length).toBe(3);
        });

        it('should extract correctly with mark', () => {
            const scanner = new NumberScanner([1, 2, 3, 4, 5]);
            scanner.consume();
            scanner.mark();
            scanner.consume(3);
            const segment = scanner.extract();
            expect(segment.value).toEqual([2, 3, 4]);
            expect(segment.mark.position).toBe(1);
            expect(segment.length).toBe(3);
        });
    });

    describe('Conditional Methods', () => {
        let scanner: NumberScanner;

        beforeEach(() => {
            scanner = new NumberScanner([1, 2, 2, 3, 4, 5, 5, 6]);
        });

        it('should check "is" correctly', () => {
            expect(scanner.is(1)).toBe(true);
            expect(scanner.is(2)).toBe(false);
            expect(scanner.is(1, 1)).toBe(false);
        });

        it('should check "isIn" correctly', () => {
            const set: Contains<number> = { has: (n: number) => n < 3 };
            expect(scanner.isIn(set)).toBe(true);
            expect(scanner.isIn(set, 3)).toBe(false);
        });

        it('should check "isIncluded" correctly', () => {
            expect(scanner.isIncluded([1, 2, 3])).toBe(true);
            expect(scanner.isIncluded([2, 3, 4])).toBe(false);
            expect(scanner.isIncluded([2, 3, 4], 1)).toBe(true);
        });

        it('should consumeIf correctly', () => {
            expect(scanner.consumeIf(1)).toBe(true);
            expect(scanner.position).toBe(1);
            expect(scanner.consumeIf(2, 2)).toBe(true);
            expect(scanner.position).toBe(3);
            expect(scanner.consumeIf(4)).toBe(false);
            expect(scanner.position).toBe(3);
        });

        it('should consumeIfIn correctly', () => {
            const set: Contains<number> = { has: (n: number) => n < 3 };
            expect(scanner.consumeIfIn(set)).toBe(true);
            expect(scanner.position).toBe(1);
            expect(scanner.consumeIfIn(set, 2)).toBe(true);
            expect(scanner.position).toBe(3);
            expect(scanner.consumeIfIn(set)).toBe(false);
            expect(scanner.position).toBe(3);
        });

        it('should consumeIfIncluded correctly', () => {
            expect(scanner.consumeIfIncluded([1, 2])).toBe(true);
            expect(scanner.position).toBe(1);
            expect(scanner.consumeIfIncluded([2, 3], 2)).toBe(true);
            expect(scanner.position).toBe(3);
            expect(scanner.consumeIfIncluded([1, 2])).toBe(false);
            expect(scanner.position).toBe(3);
        });

        it('should consumeWhile correctly', () => {
            scanner = new NumberScanner([1, 1, 1, 2, 3, 4]);
            scanner.consumeWhile(1);
            expect(scanner.position).toBe(3);
            scanner.consumeWhile(2, 2);
            expect(scanner.position).toBe(4);
        });

        it('should consumeWhileIn correctly', () => {
            const set: Contains<number> = { has: (n: number) => n < 3 };
            scanner.consumeWhileIn(set);
            expect(scanner.position).toBe(3);
            scanner.consumeWhileIn(set, 2);
            expect(scanner.position).toBe(3);
        });

        it('should consumeWhileIncluded correctly', () => {
            scanner.consumeWhileIncluded([1, 2]);
            expect(scanner.position).toBe(3);
            scanner.consumeWhileIncluded([3, 4, 5], 2);
            expect(scanner.position).toBe(5);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty data', () => {
            const scanner = new NumberScanner([]);
            expect(scanner.position).toBe(0);
            expect(scanner.isEnd).toBe(true);
            expect(scanner.peek()).toBeUndefined();
            scanner.consume();
            expect(scanner.position).toBe(0);
            expect(scanner.consumeIf(1)).toBe(false);
            expect(scanner.consumeIfIn({ has: () => true })).toBe(false);
            expect(scanner.consumeIfIncluded([1])).toBe(false);
            scanner.consumeWhile(1);
            scanner.consumeWhileIn({ has: () => true });
            scanner.consumeWhileIncluded([1]);
            expect(scanner.position).toBe(0);
        });

        it('should handle consuming beyond data length', () => {
            const scanner = new NumberScanner([1, 2, 3]);
            scanner.consume(5);
            expect(scanner.position).toBe(3);
            expect(scanner.isEnd).toBe(true);
            expect(scanner.consumeIf(1)).toBe(false);
            expect(scanner.consumeIfIn({ has: () => true })).toBe(false);
            expect(scanner.consumeIfIncluded([1])).toBe(false);
            scanner.consumeWhile(1);
            scanner.consumeWhileIn({ has: () => true });
            scanner.consumeWhileIncluded([1]);
            expect(scanner.position).toBe(3);
        });
    });

    describe('Cloning', () => {
        it('should ensure each clone is different', () => {
            const scanner = new NumberScanner([1, 2, 3]);
            const clone = scanner.clone();
            expect(scanner).not.toBe(clone);
            clone.consume();
            expect(scanner.position).not.toBe(clone.position);
            scanner.consume(3);
            expect(scanner.isEnd).not.toBe(clone.isEnd);
        });
    });
});

describe('StringScanner', () => {
    describe('Basic Functionality', () => {
        it('should initialize with correct state', () => {
            const scanner = new StringScanner('Hello');
            expect(scanner.position).toBe(0);
            expect(scanner.isEnd).toBe(false);
        });

        it('should peek correctly', () => {
            const scanner = new StringScanner('Hello');
            expect(scanner.peek()).toBe('H');
            expect(scanner.peek(2)).toBe('l');
        });

        it('should consume correctly', () => {
            const scanner = new StringScanner('Hello');
            scanner.consume(2);
            expect(scanner.position).toBe(2);
            expect(scanner.peek()).toBe('l');
        });

        it('should handle end of data', () => {
            const scanner = new StringScanner('Hi');
            scanner.consume(2);
            expect(scanner.isEnd).toBe(true);
            expect(scanner.peek()).toBeUndefined();
        });
    });

    describe('Line and Column Tracking', () => {
        it('should track columns correctly', () => {
            const data = 'Hello, World';
            const scanner = new StringScanner(data);
            expect(scanner.getMark()).toEqual({ position: 0, line: 0, column: 0 });
            scanner.consume(1); // H
            expect(scanner.getMark()).toEqual({ position: 1, line: 0, column: 1 });
            scanner.rollback();
            scanner.consume(5);
            expect(scanner.getMark()).toEqual({ position: 5, line: 0, column: 5 });
            while (!scanner.isEnd) scanner.consume();
            expect(scanner.getMark()).toEqual({ position: data.length, line: 0, column: data.length });
        });

        it('should track lines correctly', () => {
            const scanner = new StringScanner('Hello\nWorld\nTest');
            expect(scanner.getMark()).toEqual({ position: 0, line: 0, column: 0 });
            scanner.consume(6);  // 'Hello\n'
            expect(scanner.getMark()).toEqual({ position: 6, line: 1, column: 0 });
            scanner.consume(6);  // 'World\n'
            expect(scanner.getMark()).toEqual({ position: 12, line: 2, column: 0 });
        });

        it('should handle different newline characters', () => {
            const scanner = new StringScanner("Line1\nLine2\rLine3\r\nLine4");
            scanner.consume(6);  // Consume "Line1\n"
            expect(scanner.getMark()).toEqual({ position: 6, line: 1, column: 0 });
            scanner.consume(6);  // Consume "Line2\r"
            expect(scanner.getMark()).toEqual({ position: 12, line: 2, column: 0 });
            scanner.consume(7);  // Consume "Line3\r\n"
            expect(scanner.getMark()).toEqual({ position: 19, line: 3, column: 0 });
        });
    });

    describe('Marking and Rollback', () => {
        it('should mark and commit correctly', () => {
            const scanner = new StringScanner("Hello\nWorld");
            scanner.mark();
            scanner.consume(7);
            scanner.commit();
            expect(scanner.getMark()).toEqual({ position: 7, line: 1, column: 1 });
        });

        it('should mark and rollback correctly', () => {
            const scanner = new StringScanner("Hello\nWorld");
            scanner.mark();
            scanner.consume(7);
            scanner.rollback();
            expect(scanner.getMark()).toEqual({ position: 0, line: 0, column: 0 });
        });

        it('should handle nested marking', () => {
            const scanner = new StringScanner("Hello\nWorld\nTest");
            scanner.mark();
            scanner.consume(6);
            scanner.mark();
            scanner.consume(6);
            scanner.rollback();
            expect(scanner.getMark()).toEqual({ position: 6, line: 1, column: 0 });
            scanner.commit();
            expect(scanner.getMark()).toEqual({ position: 6, line: 1, column: 0 });
        });
    });

    describe('Data Extraction', () => {
        it('should capture correctly', () => {
            const scanner = new StringScanner("Hello\nWorld");
            scanner.consume(7);
            expect(scanner.captured()).toBe("Hello\nW");
        });

        it('should extract correctly', () => {
            const scanner = new StringScanner("Hello\nWorld");
            scanner.consume(7);
            const segment = scanner.extract();
            expect(segment.value).toBe("Hello\nW");
            expect(segment.mark).toEqual({ position: 0, line: 0, column: 0 });
            expect(segment.length).toBe(7);
        });
    });

    describe('Conditional Methods', () => {
        let scanner: StringScanner;

        beforeEach(() => {
            scanner = new StringScanner("Hello\nWorld\nTest");
        });

        it('should check "is" correctly', () => {
            expect(scanner.is('H')).toBe(true);
            expect(scanner.is('e')).toBe(false);
            expect(scanner.is('H', 1)).toBe(false);
        });

        it('should check "isIn" correctly', () => {
            const set = new Set(['H', 'e', 'l']);
            expect(scanner.isIn(set)).toBe(true);
            expect(scanner.isIn(set, 5)).toBe(false);
        });

        it('should check "isIncluded" correctly', () => {
            expect(scanner.isIncluded(['H', 'W'])).toBe(true);
            expect(scanner.isIncluded(['e', 'l'])).toBe(false);
            expect(scanner.isIncluded(['W', 'o'], 6)).toBe(true);
        });

        it('should consumeIf correctly', () => {
            expect(scanner.consumeIf('H')).toBe(true);
            expect(scanner.position).toBe(1);
            expect(scanner.consumeIf('e', 2)).toBe(false);
            expect(scanner.position).toBe(2);
            expect(scanner.consumeIf('l', 2)).toBe(true);
            expect(scanner.position).toBe(4);
            expect(scanner.consumeIf('W')).toBe(false);
            expect(scanner.position).toBe(4);
        });

        it('should consumeIfIn correctly', () => {
            const set = new Set(['H', 'e', 'l']);
            expect(scanner.consumeIfIn(set)).toBe(true);
            expect(scanner.position).toBe(1);
            expect(scanner.consumeIfIn(set, 2)).toBe(true);
            expect(scanner.position).toBe(3);
            expect(scanner.consumeIfIn(new Set(['W']))).toBe(false);
            expect(scanner.position).toBe(3);
        });

        it('should consumeIfIncluded correctly', () => {
            expect(scanner.consumeIfIncluded(['H', 'W'])).toBe(true);
            expect(scanner.position).toBe(1);
            expect(scanner.consumeIfIncluded(['e', 'l'], 2)).toBe(true);
            expect(scanner.position).toBe(3);
            expect(scanner.consumeIfIncluded(['W', 'T'])).toBe(false);
            expect(scanner.position).toBe(3);
        });

        it('should consumeWhile correctly', () => {
            scanner.consumeWhile('l');
            expect(scanner.position).toBe(0);
            scanner.consume(2);  // Move to first 'l'
            scanner.consumeWhile('l');
            expect(scanner.position).toBe(4);
        });

        it('should consumeWhileIn correctly', () => {
            const set = new Set(['H', 'e', 'l', 'o']);
            scanner.consumeWhileIn(set);
            expect(scanner.position).toBe(5);
            scanner.consumeWhileIn(set, 2);
            expect(scanner.position).toBe(5);
        });

        it('should consumeWhileIncluded correctly', () => {
            scanner.consumeWhileIncluded(['H', 'e', 'l', 'o']);
            expect(scanner.position).toBe(5);
            scanner.consume();
            scanner.consumeWhileIncluded(['W', 'o', 'r', 'l', 'd'], 3);
            expect(scanner.position).toBe(9);
            scanner.consumeWhileIncluded(['A', 'x', '3']);
            expect(scanner.position).toBe(9);
        });
    });

    describe('Token Generation', () => {
        it('should generate tokens correctly', () => {
            const scanner = new StringScanner("Hello\nWorld");
            scanner.consume(5);
            const token = scanner.token(1);
            expect(token).toEqual({
                type: 1,
                value: "Hello",
                mark: { position: 0, line: 0, column: 0 },
                length: 5
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty string', () => {
            const scanner = new StringScanner("");
            expect(scanner.isEnd).toBe(true);
            expect(scanner.peek()).toBeUndefined();
            scanner.consume();
            expect(scanner.position).toBe(0);
            expect(scanner.consumeIf('a')).toBe(false);
            scanner.consumeWhile('a');
            expect(scanner.position).toBe(0);
        });

        it('should handle very long lines', () => {
            const longLine = "a".repeat(10000) + "\n" + "b".repeat(10000);
            const scanner = new StringScanner(longLine);
            scanner.consume(10000);
            expect(scanner.getMark()).toEqual({ position: 10000, line: 0, column: 10000 });
            scanner.consume(1);
            expect(scanner.getMark()).toEqual({ position: 10001, line: 1, column: 0 });
        });

        it('should handle many short lines', () => {
            const manyLines = "a\n".repeat(10000);
            const scanner = new StringScanner(manyLines);
            scanner.consume(19998);
            expect(scanner.getMark()).toEqual({ position: 19998, line: 9999, column: 0 });
        });
    });
});

describe('TokenScanner', () => {
    const createToken = (type: number, value: string, position: number): Token => ({
        type,
        value,
        mark: { position, line: 0, column: position },
        length: value.length
    });

    describe('Basic Functionality', () => {
        it('should initialize with correct state', () => {
            const tokens = [createToken(1, 'Hello', 0), createToken(2, 'World', 5)];
            const scanner = new TokenScanner(tokens);
            expect(scanner.position).toBe(0);
            expect(scanner.isEnd).toBe(false);
        });

        it('should peek correctly', () => {
            const tokens = [createToken(1, 'Hello', 0), createToken(2, 'World', 5)];
            const scanner = new TokenScanner(tokens);
            expect(scanner.peek()).toEqual(tokens[0]);
            expect(scanner.peek(1)).toEqual(tokens[1]);
        });

        it('should consume correctly', () => {
            const tokens = [createToken(1, 'Hello', 0), createToken(2, 'World', 5)];
            const scanner = new TokenScanner(tokens);
            scanner.consume();
            expect(scanner.position).toBe(1);
            expect(scanner.peek()).toEqual(tokens[1]);
        });

        it('should handle end of data', () => {
            const tokens = [createToken(1, 'Hello', 0)];
            const scanner = new TokenScanner(tokens);
            scanner.consume();
            expect(scanner.isEnd).toBe(true);
            expect(scanner.peek()).toBeUndefined();
        });
    });

    describe('Token-specific Methods', () => {
        it('should return correct value', () => {
            const tokens = [createToken(1, 'Hello', 0), createToken(2, 'World', 5)];
            const scanner = new TokenScanner(tokens);
            expect(scanner.value()).toBe('Hello');
            expect(scanner.value(1)).toBe('World');
        });

        it('should return correct type', () => {
            const tokens = [createToken(1, 'Hello', 0), createToken(2, 'World', 5)];
            const scanner = new TokenScanner(tokens);
            expect(scanner.type()).toBe(1);
            expect(scanner.type(1)).toBe(2);
        });
    });

    describe('Marking and Rollback', () => {
        it('should mark and commit correctly', () => {
            const tokens = [createToken(1, 'Hello', 0), createToken(2, 'World', 5)];
            const scanner = new TokenScanner(tokens);
            scanner.mark();
            scanner.consume();
            scanner.commit();
            expect(scanner.position).toBe(1);
        });

        it('should mark and rollback correctly', () => {
            const tokens = [createToken(1, 'Hello', 0), createToken(2, 'World', 5)];
            const scanner = new TokenScanner(tokens);
            scanner.mark();
            scanner.consume();
            scanner.rollback();
            expect(scanner.position).toBe(0);
        });

        it('should handle nested marking', () => {
            const tokens = [createToken(1, 'Hello', 0), createToken(2, 'World', 5), createToken(3, '!', 10)];
            const scanner = new TokenScanner(tokens);
            scanner.mark();
            scanner.consume();
            scanner.mark();
            scanner.consume();
            scanner.rollback();
            expect(scanner.position).toBe(1);
            scanner.commit();
            expect(scanner.position).toBe(1);
        });
    });

    describe('Data Extraction', () => {
        it('should capture correctly', () => {
            const tokens = [createToken(1, 'Hello', 0), createToken(2, 'World', 5)];
            const scanner = new TokenScanner(tokens);
            scanner.consume();
            expect(scanner.captured()).toEqual([tokens[0]]);
        });

        it('should extract correctly', () => {
            const tokens = [createToken(1, 'Hello', 0), createToken(2, 'World', 5)];
            const scanner = new TokenScanner(tokens);
            scanner.consume();
            const segment = scanner.extract();
            expect(segment.value).toEqual([tokens[0]]);
            expect(segment.mark).toEqual({ position: 0 });
            expect(segment.length).toBe(1);
        });
    });

    describe('Conditional Methods', () => {
        let scanner: TokenScanner;
        let tokens: Token[];

        beforeEach(() => {
            tokens = [
                createToken(1, 'Hello', 0),
                createToken(2, 'World', 5),
                createToken(1, 'Again', 10),
                createToken(3, '!', 15)
            ];
            scanner = new TokenScanner(tokens);
        });

        it('should check "is" correctly', () => {
            expect(scanner.is(1)).toBe(true);
            expect(scanner.is(2)).toBe(false);
            expect(scanner.is(2, 1)).toBe(true);
        });

        it('should check "isIn" correctly', () => {
            const set = new Set([1, 2]);
            expect(scanner.isIn(set)).toBe(true);
            expect(scanner.isIn(new Set([2, 3]))).toBe(false);
            expect(scanner.isIn(set, 1)).toBe(true);
        });

        it('should check "isIncluded" correctly', () => {
            expect(scanner.isIncluded([1, 2])).toBe(true);
            expect(scanner.isIncluded([2, 3])).toBe(false);
            expect(scanner.isIncluded([2, 3], 1)).toBe(true);
        });

        it('should consumeIf correctly', () => {
            expect(scanner.consumeIf(1)).toBe(true);
            expect(scanner.position).toBe(1);
            expect(scanner.consumeIf(1)).toBe(false);
            expect(scanner.position).toBe(1);
            expect(scanner.consumeIf(2)).toBe(true);
            expect(scanner.position).toBe(2);
        });

        it('should consumeIfIn correctly', () => {
            const set = new Set([1, 2]);
            expect(scanner.consumeIfIn(set)).toBe(true);
            expect(scanner.position).toBe(1);
            expect(scanner.consumeIfIn(set)).toBe(true);
            expect(scanner.position).toBe(2);
            expect(scanner.consumeIfIn(new Set([3]))).toBe(false);
            expect(scanner.position).toBe(2);
        });

        it('should consumeIfIncluded correctly', () => {
            expect(scanner.consumeIfIncluded([1, 3])).toBe(true);
            expect(scanner.position).toBe(1);
            expect(scanner.consumeIfIncluded([2, 3])).toBe(true);
            expect(scanner.position).toBe(2);
            expect(scanner.consumeIfIncluded([2, 3])).toBe(false);
            expect(scanner.position).toBe(2);
        });

        it('should consumeWhile correctly', () => {
            scanner = new TokenScanner([...tokens, ...tokens]);
            scanner.consumeWhile(1);
            expect(scanner.position).toBe(1);
            scanner.consume();
            scanner.consumeWhile(1, 2);
            expect(scanner.position).toBe(3);
        });

        it('should consumeWhileIn correctly', () => {
            scanner = new TokenScanner([...tokens, ...tokens]);
            const set = new Set([1, 2]);
            scanner.consumeWhileIn(set); // [1, 2, 1]
            expect(scanner.position).toBe(3);
            scanner.consume(); // [3]
            scanner.consumeWhileIn(set, 2); // [1, 2]
            expect(scanner.position).toBe(6);
        });

        it('should consumeWhileIncluded correctly', () => {
            scanner = new TokenScanner([...tokens, ...tokens]);
            scanner.consumeWhileIncluded([1, 2]);
            expect(scanner.position).toBe(3);
            scanner.consumeWhileIncluded([1, 2, 3], 3);
            expect(scanner.position).toBe(6);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty token array', () => {
            const scanner = new TokenScanner([]);
            expect(scanner.isEnd).toBe(true);
            expect(scanner.peek()).toBeUndefined();
            scanner.consume();
            expect(scanner.position).toBe(0);
            expect(scanner.consumeIf(1)).toBe(false);
            scanner.consumeWhile(1);
            expect(scanner.position).toBe(0);
        });

        it('should handle consuming beyond token array length', () => {
            const tokens = [createToken(1, 'Hello', 0), createToken(2, 'World', 5)];
            const scanner = new TokenScanner(tokens);
            scanner.consume(3);
            expect(scanner.position).toBe(2);
            expect(scanner.isEnd).toBe(true);
            expect(scanner.consumeIf(1)).toBe(false);
            scanner.consumeWhile(1);
            expect(scanner.position).toBe(2);
        });

        it('should handle very large token arrays', () => {
            const largeTokenArray = Array(10000).fill(null).map((_, i) => createToken(i % 3, `Token${i}`, i * 5));
            const scanner = new TokenScanner(largeTokenArray);
            scanner.consume(9999);
            expect(scanner.position).toBe(9999);
            expect(scanner.isEnd).toBe(false);
            scanner.consume();
            expect(scanner.isEnd).toBe(true);
        });
    });
});