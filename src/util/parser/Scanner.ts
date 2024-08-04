export interface Indexable<T, S extends Indexable<T, S>> {
    length: number;
    slice(start?: number, end?: number): S;
    [index: number]: T | undefined;
}

export class Scanner<T, S extends Indexable<T, S>> {
    #data: S;
    #eof: T;
    #marks: number[];

    constructor(data: S, end: T) {
        this.#data = data;
        this.#eof = end;
        this.#marks = [0];
    }

    get isEnd(): boolean {
        return this.position >= this.#data.length;
    }

    get start(): number {
        return this.#marks[this.#marks.length - 2] ?? 0;
    }

    get position(): number {
        return this.#marks[this.#marks.length - 1];
    }

    set #position(value: number) {
        this.#marks[this.#marks.length - 1] = Math.min(value, this.#data.length);
    }

    peek(offset: number = 0): T {
        return this.#data[this.position + offset] ?? this.#eof;
    }

    consume(count: number = 1) {
        if (count > 0) {
            this.#position = this.position + count;
        }
    }


    mark() {
        this.#marks.push(this.position);
    }

    commit() {
        if (this.#marks.length > 1) {
            const current = this.#marks.pop()!;
            this.#position = current;
        }
    }

    rollback() {
        if (this.#marks.length === 1)
            this.#position = 0;

        else
            this.#marks.pop();
    }

    extract(): S {
        return this.#data.slice(this.start, this.position);
    }


    is(value: T, offset: number = 0): boolean { return this.peek(offset) === value; }

    isIn(set: { has: (value: T) => boolean; }, offset: number = 0): boolean { return set.has(this.peek(offset)); }
}

// Helper function overloads
export function scanner(data: string): Scanner<string | undefined, string>;
export function scanner(data: string, end: string): Scanner<string, string>;

export function scanner<T>(data: T[]): Scanner<T | undefined, (T | undefined)[]>;
export function scanner<T>(data: T[], ending: T): Scanner<T, T[]>;

export function scanner<T, S extends Indexable<any, S>>(data: S, end?: T): Scanner<any, S> {
    return (end !== undefined) ? new Scanner(data, end) : new Scanner(data, undefined);
}
