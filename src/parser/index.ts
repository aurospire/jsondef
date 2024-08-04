export type Flat<Type extends (string | string[])[]> = Type extends (string | string[])[]
    ? { [K in keyof Type]: Type[K] extends string[] ? Type[K][number] : Type[K] }
    : never;

export type Token<Type extends string> = {
    value: string;
    position: number;
    type: number;
};

// export class TokenTypeMatcher<Types extends (string | string[])[]> {
//     constructor(types: Types) { }

//     match(type: string): number {

//     }
// }