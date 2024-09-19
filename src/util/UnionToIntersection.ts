/**
 * Converts a union type `U` into an intersection type.
 *
 * This type utility leverages TypeScript's distributive conditional types and function type contravariance
 * to transform a union type into an intersection type.
 *
 * @template U - The union type to be converted to an intersection type.
 *
 * @example
 * type A = { a: string };
 * type B = { b: number };
 * type C = { c: boolean };
 * type Union = A | B | C;
 * type Intersection = UnionToIntersection<Union>;
 * // Intersection will be: { a: string } & { b: number } & { c: boolean }
 *
 * @remarks
 * How it works:
 * 1. `U extends unknown ? (x: U) => void : never` distributes over the union `U`.
 *    This means that for a union `A | B`, it will produce a union of function types:
 *    `(x: A) => void | (x: B) => void`, instead of `(x: A | B) => void`.
 * 2. The resulting union of function types is then checked against `(x: infer R) => void`.
 *    `R` is inferred so that the union of function types can be assignable to the single function
 *    The only way that is possible is if R is the interesction of all the types in the union
 */
export type UnionToIntersection<U> = (
    U extends unknown ? (x: U) => void : never // 'extends unknown' distributes (A | B) -> (x: A) => void | (x: B) => void, instead of (x: A|B) => void
) extends (x: infer R) => void ? R : never;    // checks if ALL the functions extend this (x: ?) => void, and the only way that's possible is if R is A & B
