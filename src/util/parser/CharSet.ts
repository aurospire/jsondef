type CharRange = { lower: string; upper: string; result: boolean; };

export class CharSet {
    #ranges: CharRange[] = [];

    constructor() { }


    and(set: string | { lower: string; upper: string; } | CharSet): CharSet {
        let ranges: CharRange[];

        if (typeof set === 'string')
            ranges = [{ lower: set, upper: set, result: true }];
        else if (set instanceof CharSet)
            ranges = set.#ranges;

        else
            ranges = [{ ...set, result: true }];


        const charset = new CharSet();

        charset.#ranges = [...this.#ranges, ...ranges];

        return charset;
    }

    andNot(set: string | { lower: string; upper: string; } | CharSet): CharSet {
        let ranges: CharRange[];

        if (typeof set === 'string')
            ranges = [{ lower: set, upper: set, result: false }];
        else if (set instanceof CharSet)
            ranges = set.#ranges.map(range => ({ lower: range.lower, upper: range.upper, result: !range.result }));

        else
            ranges = [{ ...set, result: false }];


        const charset = new CharSet();

        charset.#ranges = [...this.#ranges, ...ranges];

        return charset;
    }

    includes(value: string) {
        for (const range of this.#ranges)
            if ((value >= range.lower && value <= range.upper) === range.result)
                return true;

        return false;
    }

    static #empty = new CharSet();

    static char(value: string): CharSet { return this.#empty.and(value); }

    static range(value: { lower: string; upper: string; }): CharSet { return this.#empty.and(value); }


    static #upper = this.range({ lower: 'A', upper: 'Z' });
    static #lower = this.range({ lower: 'a', upper: 'z' });
    static #letter = this.#upper.and(this.#lower);
    static #digit = this.range({ lower: '0', upper: '9' });
    static #binary = this.range({ lower: '0', upper: '1' });
    static #hex = this.#digit.and({ lower: 'A', upper: 'F' }).and({ lower: 'a', upper: 'f' });
    static #letterOrDigit = this.#letter.and(this.#digit);
    static #space = this.char(' ').and('\t');
    static #newline = this.char('\n').and('\r');
    static #null = this.char('\0');
    static #ending = this.#newline.and(this.#null);

    static get Upper() { return this.#upper; }
    static get Lower() { return this.#lower; }
    static get Letter() { return this.#letter; }
    static get Digit() { return this.#digit; }
    static get Binary() { return this.#binary; }
    static get Hex() { return this.#hex; }
    static get LetterOrDigit() { return this.#letterOrDigit; }
    static get Space() { return this.#space; }
    static get NewLine() { return this.#space; }
    static get Null() { return this.#null; }
    static get Ending() { return this.#ending; }
}
