export type CharRange = { min: string; max: string; };

const emptySet = new Set<string>();

const emptyArray: CharRange[] = [];


const matchRange = (value: string, ranges: ReadonlyArray<CharRange>) => {
    for (const range of ranges)
        if (value >= range.min && value <= range.max)
            return true;

    return false;

};

type Checker = (value: string) => boolean;

type CheckerMaker = (
    trueSet: ReadonlySet<string>, trueRanges: ReadonlyArray<CharRange>,
    falseSet: ReadonlySet<string>, falseRanges: ReadonlyArray<CharRange>
) => Checker;

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

export class CharSet {
    readonly #trueSet: ReadonlySet<string>;
    readonly #trueRanges: ReadonlyArray<CharRange>;
    readonly #falseSet: ReadonlySet<string>;
    readonly #falseRanges: ReadonlyArray<CharRange>;
    readonly #checker: (value: string) => boolean;

    constructor(
        trueSet: Set<string>,
        trueRanges: Array<CharRange>,
        falseSet: Set<string>,
        falseRanges: Array<CharRange>,
    ) {
        this.#trueSet = trueSet;
        this.#trueRanges = trueRanges;
        this.#falseSet = falseSet;
        this.#falseRanges = falseRanges;
        this.#checker = this.findChecker();
    }

    findChecker() {
        const checkerType = (this.#trueSet.size ? 'A' : '') +
            (this.#trueRanges.length ? 'B' : '') +
            (this.#falseSet.size ? 'C' : '') +
            (this.#falseRanges.length ? 'D' : '');

        return checkers[checkerType](
            this.#trueSet, this.#trueRanges,
            this.#falseSet, this.#falseRanges
        );
    }

    // TODO: Optimize with overlapping or reducing 
    #union(
        trueSet: ReadonlySet<string>, trueRanges: ReadonlyArray<CharRange>,
        falseSet: ReadonlySet<string>, falseRanges: ReadonlyArray<CharRange>
    ): CharSet {
        return new CharSet(
            this.#trueSet.union(trueSet), [...this.#trueRanges, ...trueRanges],
            this.#falseSet.union(falseSet), [...this.#falseRanges, ...falseRanges]
        );
    }

    and(set: string | CharRange | CharSet): CharSet {
        if (set instanceof CharSet)
            return this.#union(set.#trueSet, set.#trueRanges, set.#falseSet, set.#falseRanges);
        else if (typeof set === 'string')
            return this.#union(new Set<string>(set), [], emptySet, []);
        else
            return this.#union(emptySet, [{ min: set.min[0] ?? '\0', max: set.max[0] ?? '\0' }], emptySet, []);
    }

    andNot(set: string | CharRange | CharSet): CharSet {
        if (set instanceof CharSet)
            return this.#union(set.#falseSet, set.#falseRanges, set.#trueSet, set.#trueRanges,);
        else if (typeof set === 'string')
            return this.#union(emptySet, [], new Set<string>(set), [],);
        else
            return this.#union(emptySet, [], emptySet, [{ min: set.min[0] ?? '\0', max: set.max[0] ?? '\0' }]);
    }

    has(value: string): boolean {
        return this.#checker(value);
    }


    static chars(value: string): CharSet { return new CharSet(new Set(value), emptyArray, emptySet, emptyArray); }

    static range(value: { min: string; max: string; }): CharSet { return new CharSet(emptySet, [value], emptySet, emptyArray); }

    static #empty = new CharSet(emptySet, emptyArray, emptySet, emptyArray);
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

    static get Empty() { return this.#empty; }
    static get Upper() { return this.#upper; }
    static get Lower() { return this.#lower; }
    static get Letter() { return this.#letter; }
    static get Digit() { return this.#digit; }
    static get Binary() { return this.#binary; }
    static get Hex() { return this.#hex; }
    static get LetterOrDigit() { return this.#letterOrDigit; }
    static get Space() { return this.#space; }
    static get NewLine() { return this.#newline; }
    static get Whitespace() { return this.#whitespace; }
    static get Null() { return this.#null; }
    static get Ending() { return this.#ending; }
}

