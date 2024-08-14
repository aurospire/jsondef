/**
 * Represents a range of characters with a minimum and maximum value.
 * The range includes all characters from `min` to `max`.
 */
export type CharRange = { 
    /** The minimum character in the range. */
    min: string; 
    /** The maximum character in the range. */
    max: string; 
};

const emptySet = new Set<string>();

const emptyArray: CharRange[] = [];

/**
 * Checks if a given string value falls within any of the specified character ranges.
 * 
 * @param value - The character to be checked.
 * @param ranges - An array of character ranges to check against.
 * @returns `true` if the value falls within any of the ranges, otherwise `false`.
 */
const matchRange = (value: string, ranges: ReadonlyArray<CharRange>): boolean => {
    for (const range of ranges) {
        if (value >= range.min && value <= range.max) {
            return true;
        }
    }
    return false;
};

/**
 * A type representing a function that checks if a given string meets certain conditions.
 */
type Checker = (value: string) => boolean;

/**
 * A function type that creates a `Checker` function based on the provided sets
 * and ranges of characters.
 * 
 * @param trueSet - A set of strings that should be matched.
 * @param trueRanges - An array of character ranges that should be matched.
 * @param falseSet - A set of strings that should not be matched.
 * @param falseRanges - An array of character ranges that should not be matched.
 * @returns A `Checker` function based on the provided sets and ranges.
 */
type CheckerMaker = (
    trueSet: ReadonlySet<string>, 
    trueRanges: ReadonlyArray<CharRange>,
    falseSet: ReadonlySet<string>, 
    falseRanges: ReadonlyArray<CharRange>
) => Checker;

/**
 * A dictionary of `CheckerMaker` functions keyed by a string representing the combination
 * of true and false sets and ranges.
 */
const checkers: Record<string, CheckerMaker> = {
    '': () => () => false,

    'A': (trueSet, trueRanges, falseSet, falseRanges) => (value) => trueSet.has(value),
    'B': (trueSet, trueRanges, falseSet, falseRanges) => (value) => matchRange(value, trueRanges),
    'C': (trueSet, trueRanges, falseSet, falseRanges) => (value) => !falseSet.has(value),
    'D': (trueSet, trueRanges, falseSet, falseRanges) => (value) => !matchRange(value, falseRanges),

    'AB': (trueSet, trueRanges, falseSet, falseRanges) => (value) => (trueSet.has(value) || matchRange(value, trueRanges)),
    'AC': (trueSet, trueRanges, falseSet, falseRanges) => (value) => trueSet.has(value) ? !falseSet.has(value) : false,
    'AD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => trueSet.has(value) ? !matchRange(value, falseRanges) : false,

    'BC': (trueSet, trueRanges, falseSet, falseRanges) => (value) => matchRange(value, trueRanges) ? !falseSet.has(value) : false,
    'BD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => matchRange(value, trueRanges) ? !matchRange(value, falseRanges) : false,
    'CD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => !(falseSet.has(value) || matchRange(value, falseRanges)),

    'ABC': (trueSet, trueRanges, falseSet, falseRanges) => (value) => (trueSet.has(value) || matchRange(value, trueRanges)) ? !falseSet.has(value) : false,
    'ABD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => (trueSet.has(value) || matchRange(value, trueRanges)) ? !matchRange(value, falseRanges) : false,
    'BCD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => matchRange(value, trueRanges) ? !(falseSet.has(value) || matchRange(value, falseRanges)) : false,

    'ABCD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => (trueSet.has(value) || matchRange(value, trueRanges)) ? !(falseSet.has(value) || matchRange(value, falseRanges)) : false,
};

/**
 * A class representing a set of characters with methods to check and combine character sets.
 */
export class CharSet {
    #trueSet: ReadonlySet<string> = emptySet;
    #trueRanges: ReadonlyArray<CharRange> = emptyArray;
    #falseSet: ReadonlySet<string> = emptySet;
    #falseRanges: ReadonlyArray<CharRange> = emptyArray;
    #checker: Checker = () => false;

    constructor() { }

    /**
     * Creates a union of the current character set with another set of characters and ranges.
     * 
     * @param trueSet - A set of characters to include in the union.
     * @param trueRanges - A set of character ranges to include in the union.
     * @param falseSet - A set of characters to exclude from the union.
     * @param falseRanges - A set of character ranges to exclude from the union.
     * @returns A new `CharSet` representing the union of the current and provided sets.
     * 
     * @remarks
     * This method currently does not optimize for overlapping or reducing the ranges.
     */
    #union(
        trueSet: ReadonlySet<string>, 
        trueRanges: ReadonlyArray<CharRange>,
        falseSet: ReadonlySet<string>, 
        falseRanges: ReadonlyArray<CharRange>
    ): CharSet {
        const charset = new CharSet();

        charset.#trueSet = this.#trueSet.union(trueSet);
        charset.#trueRanges = [...this.#trueRanges, ...trueRanges];
        charset.#falseSet = this.#falseSet.union(falseSet);
        charset.#falseRanges = [...this.#falseRanges, ...falseRanges];

        const checkerType = (charset.#trueSet.size ? 'A' : '') +
            (charset.#trueRanges.length ? 'B' : '') +
            (charset.#falseSet.size ? 'C' : '') +
            (charset.#falseRanges.length ? 'D' : '');

        charset.#checker = checkers[checkerType](
            charset.#trueSet, charset.#trueRanges,
            charset.#falseSet, charset.#falseRanges
        );

        return charset;
    }

    /**
     * Combines the current `CharSet` with another `CharSet`, character, or character range.
     * 
     * @param set - The `CharSet`, string, or `CharRange` to combine with.
     * @returns A new `CharSet` representing the combination.
     */
    and(set: string | CharRange | CharSet): CharSet {
        if (set instanceof CharSet) {
            return this.#union(set.#trueSet, set.#trueRanges, set.#falseSet, set.#falseRanges);
        } else if (typeof set === 'string') {
            return this.#union(new Set<string>(set), [], emptySet, []);
        } else {
            return this.#union(emptySet, [{ min: set.min[0] ?? '\0', max: set.max[0] ?? '\0' }], emptySet, []);
        }
    }

    /**
     * Combines the current `CharSet` with another `CharSet`, character, or character range, excluding the provided set.
     * 
     * @param set - The `CharSet`, string, or `CharRange` to exclude.
     * @returns A new `CharSet` representing the combination with exclusion.
     */
    andNot(set: string | CharRange | CharSet): CharSet {
        if (set instanceof CharSet) {
            return this.#union(set.#falseSet, set.#falseRanges, set.#trueSet, set.#trueRanges);
        } else if (typeof set === 'string') {
            return this.#union(emptySet, [], new Set<string>(set), []);
        } else {
            return this.#union(emptySet, [], emptySet, [{ min: set.min[0] ?? '\0', max: set.max[0] ?? '\0' }]);
        }
    }

    /**
     * Checks if the given value exists in the current `CharSet`.
     * 
     * @param value - The string value to check.
     * @returns `true` if the value is present in the set, otherwise `false`.
     */
    has(value: string): boolean { 
        return this.#checker(value); 
    }

    /** An empty `CharSet` instance. */
    static #empty = new CharSet();

    /**
     * Creates a `CharSet` from a string of characters.
     * 
     * @param value - The string of characters to include in the `CharSet`.
     * @returns A new `CharSet` containing the specified characters.
     */
    static chars(value: string): CharSet { 
        return this.#empty.and(value); 
    }

    /**
     * Creates a `CharSet` from a character range.
     * 
     * @param values - An object containing the minimum and maximum characters of the range.
     * @returns A new `CharSet` containing the specified character range.
     */
    static range(values: { min: string; max: string; }): CharSet { 
        return this.#empty.and(values); 
    }

    // Predefined character sets
    static #upper = this.range({ min: 'A', max: 'Z' });
    static #lower = this.range({ min: 'a', max: 'z' });
    static #letter = this.#upper.and(this.#lower);
    static #digit = this.range({ min: '0', max: '9' });
    static #binary = this.range({ min: '0', max: '1' });
    static #hex = this.#digit.and({ min: 'A', max: 'F' }).and({ min: 'a', max: 'f' });
    static #letterOrDigit = this.#letter.and(this.#digit);
    static #space = this.chars(' \t');
    static #newline = this.chars('\r\n');
    static #whitespace = this.#space.and(this.#newline);
    static #null = this.chars('\0');
    static #ending = this.#newline.and(this.#null);
    
    /** An empty `CharSet`. */
    static get Empty() { return this.#empty; }
    /** A `CharSet` containing uppercase letters. */
    static get Upper() { return this.#upper; }
    /** A `CharSet` containing lowercase letters. */
    static get Lower() { return this.#lower; }
    /** A `CharSet` containing all letters (both uppercase and lowercase). */
    static get Letter() { return this.#letter; }
    /** A `CharSet` containing digits (0-9). */
    static get Digit() { return this.#digit; }
    /** A `CharSet` containing binary digits (0-1). */
    static get Binary() { return this.#binary; }
    /** A `CharSet` containing hexadecimal digits (0-9, A-F, a-f). */
    static get Hex() { return this.#hex; }
    /** A `CharSet` containing letters and digits. */
    static get LetterOrDigit() { return this.#letterOrDigit; }
    /** A `CharSet` containing space and tab characters. */
    static get Space() { return this.#space; }
    /** A `CharSet` containing newline characters (\r and \n). */
    static get NewLine() { return this.#newline; }
    /** A `CharSet` containing whitespace characters (space, tab, and newline). */
    static get Whitespace() { return this.#whitespace; }
    /** A `CharSet` containing the null character (\0). */
    static get Null() { return this.#null; }
    /** A `CharSet` containing characters that mark the end of a line or string (newline and null). */
    static get Ending() { return this.#ending; }
}
