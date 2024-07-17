export type OneOrMore<T> = T | T[];

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer R) => void ? R : never;

export type Combine<T extends any, K extends keyof T & number> = UnionToIntersection<T[K]>;

