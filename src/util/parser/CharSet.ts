export type CharRange = { min: string; max: string; };

export class CharSet {
    #trues: CharRange[] = [];
    #falses: CharRange[] = [];

    constructor() { }


    #union(trues: CharRange[], falses: CharRange[]): CharSet {
        const charset = new CharSet();

        charset.#trues = [...this.#trues, ...trues];

        charset.#falses = [...this.#falses, ...falses];

        return charset;
    }

    and(set: string | CharRange | CharSet): CharSet {
        if (set instanceof CharSet)
            return this.#union(set.#trues, set.#falses);
        else if (typeof set === 'string')
            return this.#union([{ min: set, max: set }], []);
        else
            return this.#union([set], []);
    }

    andNot(set: string | CharRange | CharSet): CharSet {
        if (set instanceof CharSet)
            return this.#union(set.#falses, set.#trues);
        else if (typeof set === 'string')
            return this.#union([], [{ min: set, max: set }]);
        else
            return this.#union([], [set]);
    }

    has(value: string): boolean {
        let result = false;

        for (const range of this.#trues) {
            if (value >= range.min && value <= range.max) {
                result = true;
                break;
            }
        }

        if (result) {
            for (const range of this.#falses) {
                if (value >= range.min && value <= range.max) {
                    result = false;
                    break;
                }
            }
        }

        return result;
    }

    static #empty = new CharSet();

    static char(value: string): CharSet { return this.#empty.and(value); }

    static range(value: { min: string; max: string; }): CharSet { return this.#empty.and(value); }


    static #upper = this.range({ min: 'A', max: 'Z' });
    static #lower = this.range({ min: 'a', max: 'z' });
    static #letter = this.#upper.and(this.#lower);
    static #digit = this.range({ min: '0', max: '9' });
    static #binary = this.range({ min: '0', max: '1' });
    static #hex = this.#digit.and({ min: 'A', max: 'F' }).and({ min: 'a', max: 'f' });
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
    static get NewLine() { return this.#newline; }
    static get Null() { return this.#null; }
    static get Ending() { return this.#ending; }
}
