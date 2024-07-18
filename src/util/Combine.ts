export type Combine<T extends unknown, K extends keyof T & number> = UnionToIntersection<T[K]>;

export type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer R) => void ? R : never;