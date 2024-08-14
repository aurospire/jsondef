/**
 * Checks if the given value is a plain object (i.e., created by {} or new Object()).
 * 
 * @param value - The value to check.
 * @returns True if the value is a plain object, false otherwise.
 * 
 * @remarks
 * This function considers null and undefined as non-objects.
 * It returns false for arrays, functions, and objects created from custom constructors.
 */
export const isObject = (value: any): value is Object => Object.getPrototypeOf(value ?? true) === Object.prototype;