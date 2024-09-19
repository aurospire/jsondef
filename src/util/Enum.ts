/**
 * Internal type helper for flattening an array of strings or string arrays.
 * @template Types - Array of string or string arrays to flatten.
 */
type _Flatten<Types extends Array<string | string[]>> = Types extends Array<string | string[]>
    ? { [K in keyof Types]: Types[K] extends string[] ? Types[K][number] : Types[K] }
    : never;

/**
 * Flattens an array of strings or string arrays into a union type of all string elements.
 * @template Types - Array of string or string arrays to flatten.
 */
export type Flatten<Types extends Array<string | string[]>> = _Flatten<Types>[number];

/**
 * Creates a record type with keys from the flattened Types array and number values.
 * @template Types - Array of string or string arrays to use as keys.
 */
export type EnumNames<Types extends Array<string | string[]>> = Record<Flatten<Types> extends string ? Flatten<Types> : never, number>;

// /**
//  * Extracts numeric indices from a tuple type.
//  * @template T - Readonly array of strings or string arrays.
//  */
// export type EnumIds<T extends readonly (string | string[])[]> = keyof T extends infer K ? K extends `${infer N extends number}` ? N : never : never;

/**
 * Represents an enumeration with string names and numeric IDs.
 * @template Names - Array of string or string arrays defining the enum values.
 */
export class Enum<const Names extends Array<string | string[]>> {
    #ids = new Map<Flatten<Names>, number>;
    #names = new Map<number, Flatten<Names>[]>();
    #types: Record<string, number> = {};

    /**
     * Creates a new Enum instance.
     * @param types - Array of string or string arrays defining the enum values.
     * @throws {Error} If a name is defined more than once.
     */
    constructor(types: Names) {
        for (let i = 0; i < types.length; i++) {
            let type = types[i];
            if (typeof type === 'string')
                type = [type];

            for (const name of type) {
                if (this.#ids.has(name))
                    throw new Error(`Name ${name} already defined`);

                this.#ids.set(name, i);

                this.#types[name] = i;
            }

            this.#names.set(i, type);
        }

        Object.assign(this, this.#types);
    }

    /**
     * Gets the numeric ID for a given enum name.
     * @param name - The enum name to look up.
     * @returns The corresponding numeric ID, or -1 if not found.
     */
    id(name: Flatten<Names>): number {
        return this.#ids.get(name) ?? -1;
    }

    /**
     * Gets all names associated with a given numeric ID.
     * @param id - The numeric ID to look up.
     * @returns An array of names associated with the ID, or an empty array if not found.
     */
    names(id: number): Flatten<Names>[] {
        return this.#names.get(id) ?? [];
    }

    /**
     * Checks if a given name matches a specific ID.
     * @param id - The numeric ID to check.
     * @param name - The name to check.
     * @returns True if the name matches the ID, false otherwise.
     */
    matches(id: number, name: Flatten<Names>): boolean {
        return this.#ids.get(name) === id;
    }

    /**
     * Gets the enum types as a record of names to IDs.
     */
    get types(): EnumNames<Names> { return this.#types as any; }
}

/**
 * Creates an Enum instance with both Enum methods and a record of names to IDs.
 * @template Types - Array of string or string arrays defining the enum values.
 * @param types - The enum values to use.
 * @returns An Enum instance with additional properties for each enum value.
 */
export const makeEnum = <const Types extends Array<string | string[]>>(...types: Types): Enum<Types> & EnumNames<Types> => {
    const result = new Enum(types);
    return result as Enum<Types> & EnumNames<Types>;
};