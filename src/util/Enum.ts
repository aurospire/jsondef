type _Flatten<Types extends Array<string | string[]>> = Types extends Array<string | string[]>
    ? { [K in keyof Types]: Types[K] extends string[] ? Types[K][number] : Types[K] }
    : never;

export type Flatten<Types extends Array<string | string[]>> = _Flatten<Types>[number];

export type EnumNames<Types extends Array<string | string[]>> = Record<Flatten<Types> extends string ? Flatten<Types> : never, number>;

//export type EnumIds<T extends readonly (string | string[])[]> = keyof T extends infer K ? K extends `${infer N extends number}` ? N : never : never;

export class Enum<const Names extends Array<string | string[]>> {
    #ids = new Map<Flatten<Names>, number>;

    #names = new Map<number, Flatten<Names>[]>();

    #types: Record<string, number> = {};

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

    id(name: Flatten<Names>): number {
        return this.#ids.get(name) ?? -1;
    }

    names(id: number): Flatten<Names>[] {
        return this.#names.get(id) ?? [];
    }

    matches(id: number, name: Flatten<Names>): boolean {
        return this.#ids.get(name) === id;
    }

    get types(): EnumNames<Names> { return this.#types as any; }
}

export const makeEnum = <const Types extends Array<string | string[]>>(...types: Types): Enum<Types> & EnumNames<Types> => {
    const result = new Enum(types);

    return result as Enum<Types> & EnumNames<Types>;
};