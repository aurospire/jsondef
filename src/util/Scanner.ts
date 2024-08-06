import { CharSet } from "./CharSet";

export interface Indexable<T, S extends Indexable<T, S>> {
    length: number;
    slice(start?: number, end?: number): S;
    [index: number]: T | undefined;
}

export interface Contains<T> {
    has(value: T): boolean;
}

export type Mark = { position: number; };

export type Segment<S, M extends Mark> = {
    value: S;
    mark: M;
    length: number;
};

export abstract class Scanner<T, S extends Indexable<T, S>, M extends Mark = Mark> {
    #data: S;
    #marks: M[];

    constructor(data: S) {
        this.#data = data;
        this.#marks = [this.initialMark()];
    }

    protected abstract initialMark(): M;

    protected abstract onConsume(data: S, mark: M, count: number): void;

    protected getOfMark<K extends keyof M>(key: K): M[K] { return this.#marks.at(-1)![key]; }

    get isEnd(): boolean {
        return this.position >= this.#data.length;
    }

    get position(): number {
        return this.#marks.at(-1)!.position;
    }

    peek(offset: number = 0): T | undefined {
        return this.#data[this.position + offset];
    }

    consume(count: number = 1) {
        const mark = this.#marks.at(-1)!;

        // Clamp count
        count = (mark.position + count > this.#data.length) ? this.#data.length - mark.position : count;

        if (count > 0)
            this.onConsume(this.#data, mark, count);
    }


    getMark(offset: number = 0): M {
        const result = this.#marks.at(-1 - offset);

        return result ? { ...result } : this.initialMark();
    }

    mark() {
        this.#marks.push(this.getMark());
    }

    commit() {
        if (this.#marks.length > 1) {
            const last = this.#marks.pop()!;

            this.#marks[this.#marks.length - 1] = last;
        }
    }

    rollback() {
        if (this.#marks.length === 1)
            this.#marks = [this.initialMark()];
        else
            this.#marks.pop();
    }

    captured(): S {
        const start = this.#marks.at(-2)?.position ?? 0;

        return this.#data.slice(start, this.position);
    }

    extract(): Segment<S, M> {
        const start = this.#marks.at(-2)?.position ?? 0;

        return {
            mark: this.getMark(1),
            value: this.#data.slice(start, this.position),
            length: this.position - start + 1
        };
    }

    is(value: T, offset: number = 0): boolean { return this.peek(offset) === value; }

    // Should work, even if P isn't T
    isIn(set: Contains<T>, offset: number = 0): boolean { return set.has(this.peek(offset) as any); }

    isIncluded(items: T[], offset: number = 0): boolean { return items.includes(this.peek(offset) as any); }


    consumeIf(value: T): boolean { if (this.is(value)) { this.consume(); return true; } return false; }

    consumeIfIn(set: Contains<T>): boolean { if (this.isIn(set)) { this.consume(); return true; } return false; }

    consumeIfIncluded(items: T[]): boolean { if (this.isIncluded(items)) { this.consume(); return true; } return false; }
}

export class ArrayScanner<T> extends Scanner<T, Array<T>> {
    constructor(items: Array<T>) { super(items); }

    protected override initialMark(): Mark { return { position: 0 }; }

    protected override onConsume(data: Array<T>, mark: Mark, count: number): void { mark.position += count; }


    get<K extends keyof T>(key: K, offset: number = 0): T[K] | undefined {
        return this.peek(offset)?.[key];
    }

    getIs<K extends keyof T>(key: K, value: T[K], offset: number = 0): boolean {
        return this.peek(offset)?.[key] === value;
    }

    getIn<K extends keyof T>(key: K, set: Contains<T[K]>, offset: number = 0): boolean {
        return set.has(this.peek(offset)?.[key]!);
    }

    getIncluded<K extends keyof T>(key: K, items: T[K][], offset: number = 0): boolean {
        return items.includes(this.peek(offset)?.[key]!);
    }
};


export class TokenScanner extends ArrayScanner<Token> {
    value(offset: number = 0): string | undefined {
        return this.peek()?.value;
    }

    type(offset: number = 0): number | undefined {
        return this.peek()?.type;
    }

    typeIs(id: number, offset: number = 0): boolean {
        return this.type(offset) === id;
    }

    typeIn(set: Contains<number>, offset: number = 0): boolean {
        return set.has(this.type() as any);
    }

    typeIncluded(items: number[], offset: number = 0): boolean {
        return items.includes(this.type() as any);
    }

    consumeIfType(id: number): boolean { if (this.typeIs(id)) { this.consume(); return true; } return false; }
    
    consumeIfTypeIn(set: Contains<number>): boolean { if (this.typeIn(set)) { this.consume(); return true; } return false; }

    consumeIfTypeIncluded(items: number[]): boolean { if (this.typeIncluded(items)) { this.consume(); return true; } return false; }
}


export type Token = Segment<string, StringMark> & { type: number; };

export type StringMark = Mark & { line: number, column: number; };

export class StringScanner extends Scanner<string, string, StringMark> {

    constructor(value: string) { super(value); }

    protected get line() { return this.getOfMark('line'); }

    protected get column() { return this.getOfMark('column'); }

    protected override initialMark(): StringMark { return { position: 0, line: 0, column: 0 }; }

    protected override onConsume(data: string, mark: StringMark, count: number): void {
        let { position, line, column } = mark;

        for (let i = 0; i < count; i++) {
            const current = data[position++];

            const newline = current === '\n' || (current === '\r' && data[position] !== '\n');

            if (newline) {
                line++;
                column = 0;
            }
            else {
                column++;
            }
        }

        mark.position = position;
        mark.line = line;
        mark.column = column;
    }


    token(id: number): Token { return { type: id, ...this.extract() }; }


    isUpper(offset: number = 0) { return this.isIn(CharSet.Upper, offset); }

    isLower(offset: number = 0) { return this.isIn(CharSet.Lower, offset); }

    isLetter(offset: number = 0) { return this.isIn(CharSet.Letter, offset); }

    isDigit(offset: number = 0) { return this.isIn(CharSet.Digit, offset); }

    isBinary(offset: number = 0) { return this.isIn(CharSet.Binary, offset); }

    isHex(offset: number = 0) { return this.isIn(CharSet.Hex, offset); }

    isLetterOrDigit(offset: number = 0) { return this.isIn(CharSet.LetterOrDigit, offset); }

    isSpace(offset: number = 0) { return this.isIn(CharSet.Space, offset); }

    isNewLine(offset: number = 0) { return this.isIn(CharSet.NewLine, offset); }

    isWhitespace(offset: number = 0) { return this.isIn(CharSet.Whitespace, offset); }

    isNull(offset: number = 0) { return this.isIn(CharSet.Null, offset); }

    isEnding(offset: number = 0) { return this.isIn(CharSet.Ending, offset); }
}
