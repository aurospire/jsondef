export const isObject = (value: any): value is Object => Object.getPrototypeOf(value ?? true) === Object.prototype;
