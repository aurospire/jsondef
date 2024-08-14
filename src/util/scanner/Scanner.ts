/**
 * Represents an indexable structure that can be sliced.
 * @template T The type of elements in the indexable structure.
 * @template S The type of the structure itself, which should extend Indexable<T, S>.
 */
export interface Indexable<T, S extends Indexable<T, S>> {
    /**
     * The number of elements in the indexable structure.
     */
    length: number;

    /**
     * Creates a new structure containing a portion of the original structure.
     * @param start The beginning index of the specified portion. If undefined, 0 is used.
     * @param end The end index of the specified portion. This index is not included. If undefined, the length of the structure is used.
     * @returns A new structure of the same type containing the specified portion of elements.
     */
    slice(start?: number, end?: number): S;

    /**
     * Allows indexing into the structure.
     * @param index The index of the element to retrieve.
     * @returns The element at the specified index, or undefined if the index is out of bounds.
     */
    [index: number]: T | undefined;
}

/**
 * Represents a structure that can check if it contains a specific value.
 * @template T The type of values that can be checked for containment.
 */
export interface Contains<T> {
    /**
     * Checks if the structure contains a specific value.
     * @param value The value to check for.
     * @returns True if the value is contained in the structure, false otherwise.
     */
    has(value: T): boolean;
}

/**
 * Represents a mark or position within a structure.
 */
export type Mark = {
    /**
     * The numeric position of the mark.
     */
    position: number;
};

/**
 * Represents a segment of a structure, with a value, a mark, and a length.
 * @template S The type of the segment's value.
 * @template M The type of the mark, which must extend Mark.
 */
export type Segment<S, M extends Mark> = {
    /**
     * The value of the segment.
     */
    value: S;

    /**
     * The mark associated with the segment.
     */
    mark: M;

    /**
     * The length of the segment.
     */
    length: number;
};

/**
 * An abstract class representing a scanner that can traverse and manipulate an indexable structure.
 * @template T The type of elements in the indexable structure.
 * @template S The type of the indexable structure, which should extend Indexable<T, S>.
 * @template C The comparable type used for element comparisons.
 * @template M The type of marks used by the scanner, which must extend Mark.
 */
export abstract class Scanner<T, S extends Indexable<T, S>, C, M extends Mark = Mark> {
    #data: S;
    #marks: M[];

    /**
     * Creates a new Scanner instance.
     * @param from The source data or another Scanner to initialize from.
     */
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

    /**
     * Creates the initial mark for the scanner.
     * @returns The initial mark.
     */
    protected abstract initialMark(): M;

    /**
     * Handles the consumption of data.
     * @param data The data being scanned.
     * @param mark The current mark.
     * @param count The number of elements consumed.
     */
    protected abstract onConsume(data: S, mark: M, count: number): void;

    /**
     * Converts a value to its comparable form.
     * @param value The value to convert.
     * @returns The comparable form of the value.
     */
    protected abstract comparable(value: T | undefined): C;

    /**
     * Creates a clone of the current scanner.
     * @returns A new Scanner instance with the same state as the current one.
     */
    abstract clone(): Scanner<T, S, C, M>;

    /**
     * Gets a property value from the current mark.
     * @template K The key type of the mark properties.
     * @param key The key of the property to retrieve.
     * @returns The value of the specified property from the current mark.
     */
    protected getOfMark<K extends keyof M>(key: K): M[K] { return this.#marks.at(-1)![key]; }

    /**
     * Checks if the scanner has reached the end of the data.
     */
    get isEnd(): boolean { return this.position >= this.#data.length; }

    /**
     * Gets the current position of the scanner.
     */
    get position(): number { return this.#marks.at(-1)!.position; }


    /**
     * Peeks at an element at an offset of the current position without consuming it.
     * @param offset The offset from the current position to peek at. Defaults to 0.
     * @returns The element at the specified offset, or undefined if out of bounds.
     */
    peek(offset: number = 0): T | undefined { return this.#data[this.position + offset]; }

    /**
     * Consumes a specified number of elements.
     * @param count The number of elements to consume. Defaults to 1.
     */
    consume(count: number = 1) {
        const mark = this.#marks.at(-1)!;

        // Clamp count
        count = (mark.position + count > this.#data.length) ? this.#data.length - mark.position : count;

        if (count > 0)
            this.onConsume(this.#data, mark, count);
    }

    /**
     * Gets a mark at a specified offset from the current position.
     * @param offset The offset from the current position. Defaults to 0.
     * @returns A copy of the mark at the specified offset, or the initial mark if out of bounds.
     */
    getMark(offset: number = 0): M {
        const result = this.#marks.at(-1 - offset);

        return result ? { ...result } : this.initialMark();
    }

    /**
     * Creates a new mark at the current position.
     */
    mark() { this.#marks.push(this.getMark()); }

    /**
     * Commits the current mark, removing the previous mark.
     */
    commit() {
        if (this.#marks.length > 1) {
            const last = this.#marks.pop()!;

            this.#marks[this.#marks.length - 1] = last;
        }
    }

    /**
     * Rolls back to the previous mark.
     */
    rollback() {
        if (this.#marks.length === 1)
            this.#marks = [this.initialMark()];

        else
            this.#marks.pop();
    }

    /**
     * Returns the captured data between the current mark and the previous mark.
     * @returns The captured data.
     */
    captured(): S {
        const start = this.#marks.at(-2)?.position ?? 0;

        return this.#data.slice(start, this.position);
    }

    /**
     * Extracts a segment of data between the current mark and the previous mark.
     * @returns An object containing the mark, value, and length of the extracted segment.
     */
    extract(): Segment<S, M> {
        const start = this.#marks.at(-2)?.position ?? 0;

        return {
            mark: this.getMark(1),
            value: this.#data.slice(start, this.position),
            length: this.position - start
        };
    }

    #comparable(offset: number = 0): C { return this.comparable(this.#data[this.position + offset]); }

    /**
     * Checks if the current element matches a specific value.
     * @param value The value to compare against.
     * @param offset The offset from the current position to check. Defaults to 0.
     * @returns True if the element matches the value, false otherwise.
     */
    is(value: C, offset: number = 0): boolean { return !this.isEnd && this.#comparable(offset) === value; }

    /**
     * Checks if the current element is in a set of values.
     * @param set The set of values to check against.
     * @param offset The offset from the current position to check. Defaults to 0.
     * @returns True if the element is in the set, false otherwise.
     */
    isIn(set: Contains<C>, offset: number = 0): boolean { return !this.isEnd && set.has(this.#comparable(offset) as any); }

    /**
     * Checks if the current element is included in an array of values.
     * @param items The array of values to check against.
     * @param offset The offset from the current position to check. Defaults to 0.
     * @returns True if the element is included in the array, false otherwise.
     */
    isIncluded(items: C[], offset: number = 0): boolean { return !this.isEnd && items.includes(this.#comparable(offset) as any); }

    /**
     * Consumes elements if they match a specific value.
     * @param value The value to match.
     * @param count The number of elements to consume. Defaults to 1.
     * @returns True if all elements were consumed, false otherwise.
     */
    consumeIf(value: C, count: number = 1): boolean {
        while (count-- > 0) if (this.is(value)) this.consume(); else return false;
        return true;
    }

    /**
     * Consumes elements if container contains values.
     * @param container The container of values to check against.
     * @param count The number of elements to consume. Defaults to 1.
     * @returns True if all elements were consumed, false otherwise.
     */
    consumeIfIn(container: Contains<C>, count: number = 1): boolean {
        while (count-- > 0) if (this.isIn(container)) this.consume(); else return false;
        return true;
    }

    /**
     * Consumes elements if they are included in an array of values.
     * @param items The array of values to check against.
     * @param count The number of elements to consume. Defaults to 1.
     * @returns True if all elements were consumed, false otherwise.
     */
    consumeIfIncluded(items: C[], count: number = 1): boolean {
        while (count-- > 0) if (this.isIncluded(items)) this.consume(); else return false;
        return true;
    }

    /**
     * Consumes elements while they match a specific value, up to a limit.
     * @param value The value to match.
     * @param limit The maximum number of elements to consume. Defaults to Infinity.
     */
    consumeWhile(value: C, limit: number = Infinity): void { while (limit-- && this.is(value)) { this.consume(); } }

    /**
     * Consumes elements while they are in a set of values, up to a limit.
     * @param set The set of values to check against.
     * @param limit The maximum number of elements to consume. Defaults to Infinity.
     */
    consumeWhileIn(set: Contains<C>, limit: number = Infinity): void { while (limit-- && this.isIn(set)) { this.consume(); } }

    /**
     * Consumes elements while they are included in an array of values, up to a limit.
     * @param items The array of values to check against.
     * @param limit The maximum number of elements to consume. Defaults to Infinity.
     */
    consumeWhileIncluded(items: C[], limit: number = Infinity): void { while (limit-- && this.isIncluded(items)) { this.consume(); } }
}