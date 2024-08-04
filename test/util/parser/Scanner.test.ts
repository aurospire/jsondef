import { ArrayScanner, StringScanner, scanner } from '@/util/parser/Scanner';

describe('ArrayScanner', () => {
    it('should initialize correctly with empty array', () => {
        const s = new ArrayScanner([]);
        expect(s.isEnd).toBe(true);
        expect(s.position).toBe(0);
        expect(s.peek()).toBe(undefined);
    });

    it('should initialize correctly with non-empty array', () => {
        const s = new ArrayScanner([1, 2, 3]);
        expect(s.isEnd).toBe(false);
        expect(s.position).toBe(0);
        expect(s.peek()).toBe(1);
    });

    it('should peek correctly', () => {
        const s = new ArrayScanner([1, 2, 3]);
        expect(s.peek()).toBe(1);
        expect(s.peek(1)).toBe(2);
        expect(s.peek(2)).toBe(3);
        expect(s.peek(3)).toBe(undefined);
        expect(s.peek(4)).toBe(undefined);
    });

    it('should consume correctly', () => {
        const s = new ArrayScanner([1, 2, 3]);
        s.consume();
        expect(s.position).toBe(1);
        expect(s.peek()).toBe(2);
        s.consume(2);
        expect(s.position).toBe(3);
        expect(s.peek()).toBe(undefined);
    });

    it('should clamp consume to array length', () => {
        const s = new ArrayScanner([1, 2, 3]);
        s.consume(5);
        expect(s.position).toBe(3);
        expect(s.isEnd).toBe(true);
    });

    it('should mark and rollback correctly', () => {
        const s = new ArrayScanner([1, 2, 3]);
        s.consume();
        s.mark();
        s.consume(2);
        expect(s.position).toBe(3);
        s.rollback();
        expect(s.position).toBe(1);
        s.rollback();
        expect(s.position).toBe(0);
    });

    it('should rollback to 0 when no marks', () => {
        const s = new ArrayScanner([1, 2, 3]);
        s.consume(2);
        s.rollback();
        expect(s.position).toBe(0);
        s.rollback();
        expect(s.position).toBe(0);
    });

    it('should commit correctly', () => {
        const s = new ArrayScanner([1, 2, 3]);
        s.mark();
        s.consume();
        s.commit();
        expect(s.position).toBe(1);
        s.commit();
        expect(s.position).toBe(1);
        s.rollback();
        expect(s.position).toBe(0);
    });

    it('should extract correctly', () => {
        const s = new ArrayScanner([1, 2, 3]);
        s.mark();
        s.consume(2);
        const piece = s.extract(1);
        expect(piece).toEqual({
            id: 1,
            mark: { position: 0 },
            value: [1, 2],
        });
    });

    it('should check if current value is in a set', () => {
        const s = new ArrayScanner([1, 2, 3]);
        const set = new Set([1, 3]);
        expect(s.isIn(set)).toBe(true);
        s.consume();
        expect(s.isIn(set)).toBe(false);
        s.consume(2);
        expect(s.isIn(set)).toBe(false);
    });
});

describe('StringScanner', () => {
    it('should initialize correctly with empty string', () => {
        const s = new StringScanner('');
        expect(s.isEnd).toBe(true);
        expect(s.position).toBe(0);
        expect(s.peek()).toBe('\0');
    });

    it('should initialize correctly with non-empty string', () => {
        const s = new StringScanner('abc');
        expect(s.isEnd).toBe(false);
        expect(s.position).toBe(0);
        expect(s.peek()).toBe('a');
    });

    it('should peek correctly', () => {
        const s = new StringScanner('abc');
        expect(s.peek()).toBe('a');
        expect(s.peek(1)).toBe('b');
        expect(s.peek(2)).toBe('c');
        expect(s.peek(3)).toBe('\0');
        expect(s.peek(4)).toBe('\0');
    });

    it('should consume correctly', () => {
        const s = new StringScanner('abc');
        s.consume();
        expect(s.position).toBe(1);
        s.consume(2);
        expect(s.position).toBe(3);
    });

    it('should clamp consume to string length', () => {
        const s = new StringScanner('abc');
        s.consume(5);
        expect(s.position).toBe(3);
        expect(s.isEnd).toBe(true);
    });

    it('should mark and rollback correctly', () => {
        const s = new StringScanner('abc');
        s.consume();
        s.mark();
        s.consume(2);
        expect(s.position).toBe(3);
        s.rollback();
        expect(s.position).toBe(1);
    });

    it('should rollback to 0 when no marks', () => {
        const s = new StringScanner('abc');
        s.consume(2);
        s.rollback();
        expect(s.position).toBe(0);
    });

    it('should commit correctly', () => {
        const s = new StringScanner('abc');
        s.mark();
        s.consume();
        s.commit();
        expect(s.position).toBe(1);
        s.rollback();
        expect(s.position).toBe(0);
    });

    it('should extract correctly', () => {
        const s = new StringScanner('abc');
        s.mark();
        s.consume(2);
        const piece = s.extract(1);
        expect(piece).toEqual({
            id: 1,
            mark: { position: 0, line: 0, column: 0 },
            value: 'ab',
        });
    });

    it('should handle line and column correctly', () => {
        const s = new StringScanner('a\nbc\r\nc');
        expect(s.getMark()).toEqual({ position: 0, line: 0, column: 0 });
        s.consume();
        expect(s.getMark()).toEqual({ position: 1, line: 0, column: 1 });
        s.consume();
        expect(s.getMark()).toEqual({ position: 2, line: 1, column: 0 });
        s.consume();
        expect(s.getMark()).toEqual({ position: 3, line: 1, column: 1 });
        s.consume();
        expect(s.getMark()).toEqual({ position: 4, line: 1, column: 2 });
        s.consume(2);
        expect(s.getMark()).toEqual({ position: 6, line: 2, column: 0 });
        s.consume();
        expect(s.getMark()).toEqual({ position: 7, line: 2, column: 1 });
        expect(s.isEnd).toBe(true);
    });

    it('should handle complex line and column scenarios', () => {
        const s = new StringScanner(`a\n\r\n\rb\r\n\n`);
        s.consume(8);
        expect(s.getMark()).toEqual({ position: 8, line: 4, column: 0 });
    });
});

describe('scanner factory function', () => {
    it('should create ArrayScanner for arrays', () => {
        const s = scanner([1, 2, 3]);
        expect(s).toBeInstanceOf(ArrayScanner);
    });

    it('should create StringScanner for strings', () => {
        const s = scanner('abc');
        expect(s).toBeInstanceOf(StringScanner);
    });
});