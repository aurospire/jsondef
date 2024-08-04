import { Scanner, scanner } from '@/util/parser/Scanner';

describe('Scanner', () => {
    describe('String Scanner', () => {
        let strScanner: Scanner<string, string>;

        beforeEach(() => {
            strScanner = scanner('Hello, World!', '');
        });

        test('constructor and initial state', () => {
            expect(strScanner.isEnd).toBe(false);
            expect(strScanner.start).toBe(0);
            expect(strScanner.position).toBe(0);
        });

        test('peek', () => {
            expect(strScanner.peek()).toBe('H');
            expect(strScanner.peek(1)).toBe('e');
            expect(strScanner.peek(100)).toBe('');
        });

        test('consume', () => {
            strScanner.consume(2);
            expect(strScanner.position).toBe(2);
            expect(strScanner.peek()).toBe('l');
        });

        test('mark and commit', () => {
            strScanner.mark();
            strScanner.consume(5);
            expect(strScanner.position).toBe(5);
            strScanner.commit();
            expect(strScanner.position).toBe(5);
            expect(strScanner.start).toBe(0);
        });

        test('mark and rollback', () => {
            strScanner.mark();
            strScanner.consume(5);
            expect(strScanner.position).toBe(5);
            strScanner.rollback();
            expect(strScanner.position).toBe(0);
        });

        test('extract', () => {
            strScanner.consume(5);
            expect(strScanner.extract()).toBe('Hello');
        });

        test('is', () => {
            expect(strScanner.is('H')).toBe(true);
            expect(strScanner.is('h')).toBe(false);
            expect(strScanner.is('e', 1)).toBe(true);
        });

        test('isIn', () => {
            const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
            expect(strScanner.isIn(vowels)).toBe(false);
            expect(strScanner.isIn(vowels, 1)).toBe(true);
        });

        test('isEnd', () => {
            expect(strScanner.isEnd).toBe(false);
            strScanner.consume(13);
            expect(strScanner.isEnd).toBe(true);
        });
    });

    describe('Array Scanner', () => {
        let arrScanner: Scanner<number, number[]>;

        beforeEach(() => {
            arrScanner = scanner([1, 2, 3, 4, 5], NaN);
        });

        test('constructor and initial state', () => {
            expect(arrScanner.isEnd).toBe(false);
            expect(arrScanner.start).toBe(0);
            expect(arrScanner.position).toBe(0);
        });

        test('peek', () => {
            expect(arrScanner.peek()).toBe(1);
            expect(arrScanner.peek(1)).toBe(2);
            expect(arrScanner.peek(100)).toBeNaN();
        });

        test('consume', () => {
            arrScanner.consume(2);
            expect(arrScanner.position).toBe(2);
            expect(arrScanner.peek()).toBe(3);
        });

        test('mark and commit', () => {
            arrScanner.mark();
            arrScanner.consume(3);
            expect(arrScanner.position).toBe(3);
            arrScanner.commit();
            expect(arrScanner.position).toBe(3);
            expect(arrScanner.start).toBe(0);
        });

        test('mark and rollback', () => {
            arrScanner.mark();
            arrScanner.consume(3);
            expect(arrScanner.position).toBe(3);
            arrScanner.rollback();
            expect(arrScanner.position).toBe(0);
        });

        test('extract', () => {
            arrScanner.consume(3);
            expect(arrScanner.extract()).toEqual([1, 2, 3]);
        });

        test('is', () => {
            expect(arrScanner.is(1)).toBe(true);
            expect(arrScanner.is(2)).toBe(false);
            expect(arrScanner.is(2, 1)).toBe(true);
        });

        test('isIn', () => {
            const oddNumbers = new Set([1, 3, 5]);
            expect(arrScanner.isIn(oddNumbers)).toBe(true);
            expect(arrScanner.isIn(oddNumbers, 1)).toBe(false);
        });

        test('isEnd', () => {
            expect(arrScanner.isEnd).toBe(false);
            arrScanner.consume(5);
            expect(arrScanner.isEnd).toBe(true);
            expect(arrScanner.peek()).toBeNaN();
        });
    });

    describe('scanner helper function', () => {
        test('string scanner without end character', () => {
            const s = scanner('test');
            expect(s.peek()).toBe('t');
            expect(s.peek(100)).toBe(undefined);
        });

        test('string scanner with end character', () => {
            const s = scanner('test', '');
            expect(s.peek()).toBe('t');
            expect(s.peek(100)).toBe('');
        });

        test('array scanner without end value', () => {
            const s = scanner([1, 2, 3]);
            expect(s.peek()).toBe(1);
            expect(s.peek(100)).toBe(undefined);
        });

        test('array scanner with end value', () => {
            const s = scanner([1, 2, 3], 0);
            expect(s.peek()).toBe(1);
            expect(s.peek(100)).toBe(0);
        });
    });
});