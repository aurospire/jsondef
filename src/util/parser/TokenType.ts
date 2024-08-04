type _Flatten<Types extends Array<string | string[]>> = Types extends Array<string | string[]>
    ? { [K in keyof Types]: Types[K] extends string[] ? Types[K][number] : Types[K] }
    : never;

export type Flatten<Types extends Array<string | string[]>> = _Flatten<Types>[number];

export type TokenTypeEnum<Types extends Array<string | string[]>> = Record<Flatten<Types> extends string ? Flatten<Types> : never, number>;


export class TokenType<const Types extends Array<string | string[]>> {
    #ids = new Map<Flatten<Types>, number>;

    #names = new Map<number, Flatten<Types>[]>();

    #types: Record<string, number> = {};

    constructor(types: Types) {

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

    id(name: Flatten<Types>): number {
        return this.#ids.get(name) ?? -1;
    }

    names(id: number): Flatten<Types>[] {
        return this.#names.get(id) ?? [];
    }

    matches(id: number, name: Flatten<Types>): boolean {
        return this.#ids.get(name) === id;
    }

    get types(): TokenTypeEnum<Types> { return this.#types as any; }
}

export const tokenTypes = <const Types extends Array<string | string[]>>(...types: Types): TokenType<Types> & TokenTypeEnum<Types> => {
    const result = new TokenType(types);

    return result as TokenType<Types> & TokenTypeEnum<Types>;
};