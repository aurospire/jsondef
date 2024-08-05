export interface Indexable<T, S extends Indexable<T, S>> {
    length: number;
    slice(start?: number, end?: number): S;
    [index: number]: T | undefined;
}

export type Mark = { position: number; };

export type Segment<S, M extends Mark> = {
    value: S;
    mark: M;
};

export abstract class Scanner<P, T extends P, S extends Indexable<T, S>, M extends Mark = Mark> {
    #data: S;
    #marks: M[];

    constructor(data: S) {
        this.#data = data;
        this.#marks = [this.initialMark()];
    }

    protected abstract get ending(): P;

    protected abstract initialMark(): M;

    protected abstract onConsume(data: S, mark: M, count: number): void;

    protected get<K extends keyof M>(key: K): M[K] { return this.#marks.at(-1)![key]; }

    get isEnd(): boolean {
        return this.position >= this.#data.length;
    }

    get position(): number {
        return this.#marks.at(-1)!.position;
    }

    peek(offset: number = 0): P {
        return this.#data[this.position + offset] ?? this.ending;
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

    extract(): Segment<S, M> {
        const start = this.#marks.at(-2)?.position ?? 0;

        return {
            mark: this.getMark(1),
            value: this.#data.slice(start, this.position)
        };
    }

    is(value: T, offset: number = 0): boolean { return this.peek(offset) === value; }

    // Should work, even if P isn't T
    isIn(set: { has: (value: T) => boolean; }, offset: number = 0): boolean { return set.has(this.peek(offset) as any); }
}

export class ArrayScanner<T> extends Scanner<T | undefined, T, Array<T>> {
    constructor(items: Array<T>) { super(items); }

    protected override get ending() { return undefined; }

    protected override initialMark(): Mark { return { position: 0 }; }

    protected override onConsume(data: Array<T>, mark: Mark, count: number): void { mark.position += count; }
};

export type Token = Segment<string, StringMark> & { id: number; };

export type StringMark = Mark & { line: number, column: number; };

export class StringScanner extends Scanner<string, string, string, StringMark> {

    constructor(value: string) { super(value); }

    protected get line() { return this.get('line'); }

    protected get column() { return this.get('column'); }

    protected override get ending(): string { return ''; }

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

    token(id: number): Token { return { id, ...this.extract() }; }
}


type ScannerType<S extends string | unknown[]> = S extends Array<infer T> ? ArrayScanner<T> : StringScanner;

export const makeScanner = <S extends string | unknown[]>(data: S): ScannerType<S> => {
    return (typeof data === 'string' ? new StringScanner(data) : new ArrayScanner(data)) as ScannerType<S>;
};
