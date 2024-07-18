/**
 * Represents either a single instance or an array of instances of a given type.
 *
 * @typeParam T - The type of the elements.
 */
export type OneOrMore<T> = T | T[];

/**
 * Combines the types at numeric keys of a tuple or array into a single intersected type.
 * Useful for creating a unified type from a tuple's or array's specific indexed types.
 *
 * @typeParam T - A tuple or array with types.
 * @typeParam K - The numeric keys of the tuple or array that should be combined.
 */
export type Combine<T extends unknown, K extends keyof T & number> = UnionToIntersection<T[K]>;

/**
 * Converts a union type to an intersection type. This type uses a distributive conditional type
 * to map each member of a union to an intersection.
 *
 * @typeParam U - The union type to be transformed into an intersection type.
 */
export type UnionToIntersection<U> = 
  (U extends unknown ? (x: U) => void : never) extends (x: infer R) => void ? R : never;
