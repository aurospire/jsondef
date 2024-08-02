import { CharSet } from './CharSet';

export class Scanner {
    #data: string;
    #marks: number[];

    constructor(data: string) {
        this.#data = data;
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

    peek(offset: number = 0): string {
        return this.#data[this.position + offset] ?? '\0';
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

    extract(): string {
        return this.#data.slice(this.start, this.position);
    }


    is(value: string, offset: number = 0): boolean { return this.peek(offset) === value; }

    isIn(set: CharSet, offset: number = 0): boolean { return set.includes(this.peek(offset)); }
}
