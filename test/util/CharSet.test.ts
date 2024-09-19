import { CharSet } from '@/util/CharSet';

describe('CharSet', () => {
    describe('Constructor and basic methods', () => {
        test('constructor creates an empty set', () => {
            const set = new CharSet();
            expect(set.has('a')).toBe(false);
        });

        test('and with string', () => {
            const set = new CharSet().and('a');
            expect(set.has('a')).toBe(true);
            expect(set.has('b')).toBe(false);
        });

        test('and with range', () => {
            const set = new CharSet().and({ min: 'a', max: 'c' });
            expect(set.has('a')).toBe(true);
            expect(set.has('b')).toBe(true);
            expect(set.has('c')).toBe(true);
            expect(set.has('d')).toBe(false);
        });

        test('and with another CharSet', () => {
            const set1 = new CharSet().and('a');
            const set2 = new CharSet().and('b');
            const combinedSet = set1.and(set2);
            expect(combinedSet.has('a')).toBe(true);
            expect(combinedSet.has('b')).toBe(true);
            expect(combinedSet.has('c')).toBe(false);
        });

        test('andNot with string', () => {
            const set = new CharSet().and({ min: 'a', max: 'c' }).andNot('b');
            expect(set.has('a')).toBe(true);
            expect(set.has('b')).toBe(false);
            expect(set.has('c')).toBe(true);
        });

        test('andNot with range', () => {
            const set = new CharSet().and({ min: 'a', max: 'z' }).andNot({ min: 'm', max: 'o' });
            expect(set.has('l')).toBe(true);
            expect(set.has('m')).toBe(false);
            expect(set.has('n')).toBe(false);
            expect(set.has('o')).toBe(false);
            expect(set.has('p')).toBe(true);
        });

        test('andNot with another CharSet', () => {
            const set1 = new CharSet().and({ min: 'a', max: 'z' });
            const set2 = new CharSet().and({ min: 'a', max: 'c' });
            const resultSet = set1.andNot(set2);
            expect(resultSet.has('a')).toBe(false);
            expect(resultSet.has('b')).toBe(false);
            expect(resultSet.has('c')).toBe(false);
            expect(resultSet.has('d')).toBe(true);
        });
    });

    describe('Static methods', () => {
        test('chars - single', () => {
            const set = CharSet.chars('x');
            expect(set.has('x')).toBe(true);
            expect(set.has('y')).toBe(false);
        });

        test('chars - multiple', () => {
            const set = CharSet.chars('xyz');
            expect(set.has('x')).toBe(true);
            expect(set.has('y')).toBe(true);
            expect(set.has('z')).toBe(true);
            expect(set.has('xyz')).toBe(false);
        });

        test('range', () => {
            const set = CharSet.range({ min: '1', max: '5' });
            expect(set.has('0')).toBe(false);
            expect(set.has('1')).toBe(true);
            expect(set.has('3')).toBe(true);
            expect(set.has('5')).toBe(true);
            expect(set.has('6')).toBe(false);
        });
    });

    describe('Static properties', () => {
        test('Upper', () => {
            expect(CharSet.Upper.has('A')).toBe(true);
            expect(CharSet.Upper.has('Z')).toBe(true);
            expect(CharSet.Upper.has('a')).toBe(false);
        });

        test('Lower', () => {
            expect(CharSet.Lower.has('a')).toBe(true);
            expect(CharSet.Lower.has('z')).toBe(true);
            expect(CharSet.Lower.has('A')).toBe(false);
        });

        test('Letter', () => {
            expect(CharSet.Letter.has('A')).toBe(true);
            expect(CharSet.Letter.has('z')).toBe(true);
            expect(CharSet.Letter.has('1')).toBe(false);
        });

        test('Digit', () => {
            expect(CharSet.Digit.has('0')).toBe(true);
            expect(CharSet.Digit.has('9')).toBe(true);
            expect(CharSet.Digit.has('a')).toBe(false);
        });

        test('Binary', () => {
            expect(CharSet.Binary.has('0')).toBe(true);
            expect(CharSet.Binary.has('1')).toBe(true);
            expect(CharSet.Binary.has('2')).toBe(false);
        });

        test('Hex', () => {
            expect(CharSet.Hex.has('0')).toBe(true);
            expect(CharSet.Hex.has('9')).toBe(true);
            expect(CharSet.Hex.has('a')).toBe(true);
            expect(CharSet.Hex.has('f')).toBe(true);
            expect(CharSet.Hex.has('A')).toBe(true);
            expect(CharSet.Hex.has('F')).toBe(true);
            expect(CharSet.Hex.has('g')).toBe(false);
        });

        test('LetterOrDigit', () => {
            expect(CharSet.LetterOrDigit.has('A')).toBe(true);
            expect(CharSet.LetterOrDigit.has('z')).toBe(true);
            expect(CharSet.LetterOrDigit.has('0')).toBe(true);
            expect(CharSet.LetterOrDigit.has('9')).toBe(true);
            expect(CharSet.LetterOrDigit.has('!')).toBe(false);
        });

        test('Space', () => {
            expect(CharSet.Space.has(' ')).toBe(true);
            expect(CharSet.Space.has('\t')).toBe(true);
            expect(CharSet.Space.has('\n')).toBe(false);
        });

        test('NewLine', () => {
            expect(CharSet.NewLine.has('\n')).toBe(true);
            expect(CharSet.NewLine.has('\r')).toBe(true);
        });

        test('Null', () => {
            expect(CharSet.Null.has('\0')).toBe(true);
            expect(CharSet.Null.has('a')).toBe(false);
        });

        test('Ending', () => {
            expect(CharSet.Ending.has('\n')).toBe(true);
            expect(CharSet.Ending.has('\r')).toBe(true);
            expect(CharSet.Ending.has('\0')).toBe(true);
            expect(CharSet.Ending.has('a')).toBe(false);
        });
    });

    describe('Complex scenarios', () => {
        test('Combining multiple operations', () => {
            const set = new CharSet()
                .and({ min: 'a', max: 'z' })
                .andNot({ min: 'x', max: 'z' })
                .and('0')
                .and(CharSet.Upper);

            expect(set.has('a')).toBe(true);
            expect(set.has('w')).toBe(true);
            expect(set.has('x')).toBe(false);
            expect(set.has('y')).toBe(false);
            expect(set.has('z')).toBe(false);
            expect(set.has('0')).toBe(true);
            expect(set.has('1')).toBe(false);
            expect(set.has('A')).toBe(true);
            expect(set.has('Z')).toBe(true);
        });

        test('Chaining static methods', () => {
            const set = CharSet.Letter.and(CharSet.Digit).andNot(CharSet.Hex);

            expect(set.has('g')).toBe(true);
            expect(set.has('G')).toBe(true);
            expect(set.has('A')).toBe(false);
            expect(set.has('a')).toBe(false);
            expect(set.has('0')).toBe(false);
            expect(set.has('7')).toBe(false);
            expect(set.has('8')).toBe(false);
        });
    });
});