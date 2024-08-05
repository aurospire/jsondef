export type CharRange = { min: string; max: string; };

const emptySet = new Set<string>();

type Checker = (value: string) => boolean;

const matchRange = (value: string, ranges: CharRange[]) => {
    for (const range of ranges)
        if (value >= range.min && value <= range.max)
            return true;

    return false;
};

type CheckerMaker = (
    trueSet: Set<string>, trueRanges: CharRange[],
    falseSet: Set<string>, falseRanges: CharRange[]
) => Checker;

const checkers: Record<string, CheckerMaker> = {
    'A': (trueSet, trueRanges, falseSet, falseRanges) => (value) => trueSet.has(value),
    'B': (trueSet, trueRanges, falseSet, falseRanges) => (value) => matchRange(value, trueRanges),
    'C': (trueSet, trueRanges, falseSet, falseRanges) => (value) => !falseSet.has(value),
    'D': (trueSet, trueRanges, falseSet, falseRanges) => (value) => !matchRange(value, falseRanges),

    'AB': (trueSet, trueRanges, falseSet, falseRanges) => (value) => (trueSet.has(value) || matchRange(value, trueRanges)),
    'AC': (trueSet, trueRanges, falseSet, falseRanges) => (value) => trueSet.has(value) ? !falseSet.has(value) : false,
    'AD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => trueSet.has(value) ? !matchRange(value, falseRanges) : false,

    'BC': (trueSet, trueRanges, falseSet, falseRanges) => (value) => matchRange(value, trueRanges) ? !falseSet.has(value) : false,
    'BD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => matchRange(value, trueRanges) ? !matchRange(value, trueRanges) : false,
    'CD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => !(falseSet.has(value) || matchRange(value, falseRanges)),

    'ABC': (trueSet, trueRanges, falseSet, falseRanges) => (value) => (trueSet.has(value) || matchRange(value, trueRanges)) ? !falseSet.has(value) : false,
    'ABD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => (trueSet.has(value) || matchRange(value, trueRanges)) ? !matchRange(value, falseRanges) : false,
    'BCD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => matchRange(value, trueRanges) ? !(falseSet.has(value) || matchRange(value, falseRanges)) : false,

    'ABCD': (trueSet, trueRanges, falseSet, falseRanges) => (value) => (trueSet.has(value) || matchRange(value, trueRanges)) ? !(falseSet.has(value) || matchRange(value, falseRanges)) : false,
};

export class CharSet {
    #trueSet: Set<string> = emptySet;
    #trueRanges: CharRange[] = [];

    #falseSet: Set<string> = emptySet;
    #falseRanges: CharRange[] = [];

    #checker: (value: string) => boolean = () => false;

    constructor() { }


    // TODO: Optimize with overlapping or reducing
    #union(trueSet: Set<string>, trueRanges: CharRange[], falseSet: Set<string>, falseRanges: CharRange[]): CharSet {
        const charset = new CharSet();

        charset.#trueSet = this.#trueSet.union(trueSet);

        charset.#trueRanges = [...this.#trueRanges, ...trueRanges];


        charset.#falseSet = this.#falseSet.union(falseSet);

        charset.#falseRanges = [...this.#falseRanges, ...falseRanges];


        const checkerType = (charset.#trueSet.size ? 'A' : '') +
            (charset.#trueRanges.length ? 'B' : '') +
            (charset.#falseSet.size ? 'C' : '') +
            (charset.#falseRanges.length ? 'D' : '');

        this.#checker = checkers[checkerType](
            charset.#trueSet, charset.#trueRanges,
            charset.#falseSet, charset.#falseRanges
        );

        return charset;
    }

    and(set: string | CharRange | CharSet): CharSet {
        if (set instanceof CharSet)
            return this.#union(set.#trueSet, set.#trueRanges, set.#falseSet, set.#falseRanges);
        else if (typeof set === 'string')
            return this.#union(new Set<string>(set), [], emptySet, []);
        else
            return this.#union(emptySet, [set], emptySet, []);
    }

    andNot(set: string | CharRange | CharSet): CharSet {
        if (set instanceof CharSet)
            return this.#union(set.#falseSet, set.#falseRanges, set.#trueSet, set.#trueRanges,);
        else if (typeof set === 'string')
            return this.#union(emptySet, [], new Set<string>(set), [],);
        else
            return this.#union(emptySet, [], emptySet, [set]);
    }

    has(value: string): boolean {
        return this.#checker(value);
    }

    static #empty = new CharSet();

    static chars(value: string): CharSet { return this.#empty.and(value); }

    static range(value: { min: string; max: string; }): CharSet { return this.#empty.and(value); }

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
