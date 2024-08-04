type _Flat<Types extends Array<string | string[]>> = Types extends Array<string | string[]>
    ? { [K in keyof Types]: Types[K] extends string[] ? Types[K][number] : Types[K] }
    : never;

export type Flatten<Types extends Array<string | string[]>> = _Flat<Types>[number];


export class TokenType<const Types extends Array<string | string[]>> {
    #ids = new Map<Flatten<Types>, number>;
    #names = new Map<number, Flatten<Types>[]>();

    constructor(types: Types) {
        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            if (typeof type === 'string') {
                this.#ids.set(type, i);

                this.#names.set(i, [type]);
            }
            else {
                for (const name of type)
                    this.#ids.set(name, i);

                this.#names.set(i, type);
            }
        }
    }

    find(name: Flatten<Types>): number {
        return this.#ids.get(name) ?? -1;
    }

    names(id: number): Flatten<Types>[] {
        return this.#names.get(id) ?? [];
    }

    matches(id: number, name: Flatten<Types>): boolean {
        return this.#ids.get(name) === id;
    }
}
