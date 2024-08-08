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

export abstract class Scanner<T, S extends Indexable<T, S>, C, M extends Mark = Mark> {
    #data: S;
    #marks: M[];

    constructor(from: S | Scanner<T, S, C, M>) {
        if (from instanceof Scanner) {
            this.#data = from.#data;
            this.#marks = from.#marks.map(mark => ({ ...mark }));
        }
        else {
            this.#data = from;
            this.#marks = [this.initialMark()];
        }
    }

    protected abstract initialMark(): M;

    protected abstract onConsume(data: S, mark: M, count: number): void;

    protected abstract comparable(value: T | undefined): C;

    protected getOfMark<K extends keyof M>(key: K): M[K] { return this.#marks.at(-1)![key]; }

    abstract clone(): Scanner<T, S, C, M>;


    get isEnd(): boolean {
        return this.position >= this.#data.length;
    }

    get position(): number {
        return this.#marks.at(-1)!.position;
    }

    peek(offset: number = 0): T | undefined {
        return this.#data[this.position + offset];
    }

    #comparable(offset: number = 0): C {
        return this.comparable(this.#data[this.position + offset]);
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
            length: this.position - start
        };
    }

    is(value: C, offset: number = 0): boolean { return !this.isEnd && this.#comparable(offset) === value; }

    // Should work, even if P isn't T
    isIn(set: Contains<C>, offset: number = 0): boolean { return !this.isEnd && set.has(this.#comparable(offset) as any); }

    isIncluded(items: C[], offset: number = 0): boolean { return !this.isEnd && items.includes(this.#comparable(offset) as any); }


    consumeIf(value: C, count: number = 1): boolean {
        while (count-- > 0) if (this.is(value)) this.consume(); else return false;
        return true;
    }

    consumeIfIn(set: Contains<C>, count: number = 1): boolean {
        while (count-- > 0) if (this.isIn(set)) this.consume(); else return false;
        return true;
    }

    consumeIfIncluded(items: C[], count: number = 1): boolean {
        while (count-- > 0) if (this.isIncluded(items)) this.consume(); else return false;
        return true;
    }


    consumeWhile(value: C, limit: number = Infinity): void { while (limit-- && this.is(value)) { this.consume(); } }

    consumeWhileIn(set: Contains<C>, limit: number = Infinity): void { while (limit-- && this.isIn(set)) { this.consume(); } }

    consumeWhileIncluded(items: C[], limit: number = Infinity): void { while (limit-- && this.isIncluded(items)) { this.consume(); } }
}


export type Token = Segment<string, StringMark> & { type: number; };

export type StringMark = Mark & { line: number, column: number; };

export class StringScanner extends Scanner<string, string, string, StringMark> {

    constructor(from: string | StringScanner) { super(from); }

    protected get line() { return this.getOfMark('line'); }

    protected get column() { return this.getOfMark('column'); }

    protected override initialMark(): StringMark { return { position: 0, line: 0, column: 0 }; }

    protected override comparable(value: string | undefined): string { return value as string; }

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


    override clone(): StringScanner { return new StringScanner(this); }

    token(id: number): Token { return { type: id, ...this.extract() }; }
}


export class TokenScanner extends Scanner<Token, Token[], number> {

    constructor(from: Token[] | TokenScanner) { super(from); }

    protected override initialMark(): Mark { return { position: 0 }; }

    protected override comparable(value: Token | undefined) { return value?.type as number; }

    protected override onConsume(data: Token[], mark: Mark, count: number): void { mark.position += count; }

    override clone(): TokenScanner { return new TokenScanner(this); }

    value(offset: number = 0): string | undefined { return this.peek(offset)?.value; }

    type(offset: number = 0): number | undefined { return this.peek(offset)?.type; }
}

