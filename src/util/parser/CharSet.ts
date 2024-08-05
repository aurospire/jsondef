export type CharRange = { min: string; max: string; };

const emptySet = new Set<string>();

export class CharSet {
    #trueSet: Set<string> = emptySet;
    #falseSet: Set<string> = emptySet;
    #trueRanges: CharRange[] = [];
    #falseRanges: CharRange[] = [];

    constructor() { }


    #union(trueSet: Set<string>, falseSet: Set<string>, trueRanges: CharRange[], falseRanges: CharRange[]): CharSet {
        const charset = new CharSet();

        charset.#trueSet = this.#trueSet.union(trueSet);

        charset.#falseSet = this.#falseSet.union(falseSet);

        charset.#trueRanges = [...this.#trueRanges, ...trueRanges];

        charset.#falseRanges = [...this.#falseRanges, ...falseRanges];

        return charset;
    }

    and(set: string | CharRange | CharSet): CharSet {
        if (set instanceof CharSet)
            return this.#union(set.#trueSet, set.#falseSet, set.#trueRanges, set.#falseRanges);
        else if (typeof set === 'string')
            return this.#union(new Set<string>(set), emptySet, [], []);
        else
            return this.#union(emptySet, emptySet, [set], []);
    }

    andNot(set: string | CharRange | CharSet): CharSet {
        if (set instanceof CharSet)
            return this.#union(set.#falseSet, set.#trueSet, set.#falseRanges, set.#trueRanges);
        else if (typeof set === 'string')
            return this.#union(emptySet, new Set<string>(set), [], []);
        else
            return this.#union(emptySet, emptySet, [], [set]);
    }

    has(value: string): boolean {
        let result = false;

        if (this.#trueSet.has(value)) {
            result = true;
        }
        else {
            for (const range of this.#trueRanges) {
                if (value >= range.min && value <= range.max) {
                    result = true;
                    break;
                }
            }
        }

        if (result) {
            if (this.#falseSet.has(value)) {
                result = false;
            }
            else {
                for (const range of this.#falseRanges) {
                    if (value >= range.min && value <= range.max) {
                        result = false;
                        break;
                    }
                }
            }
        }

        return result;
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
