/**
 * Represents a string in the format of a regular expression, including delimiters and flags.
 * The format is '/pattern/flags'.
 */
export type RegexString = `/${string}/${string}`;

let regexMap: Map<string, RegExp> = new Map<string, RegExp>();

/**
 * Converts a RegexString to a RegExp object.
 * If the RegexString has been converted before, it returns the cached RegExp object.
 * 
 * @param regexString - The RegexString to convert.
 * @returns The corresponding RegExp object, or undefined if conversion fails.
 */
const toRegExp = (regexString: RegexString): RegExp | undefined => {
    let regex = regexMap.get(regexString);

    if (!regex) {
        const [match, pattern, flags] = regexString.match(/\/(.+)\/(.*)/) ?? [];

        if (match)
            try { regex = new RegExp(pattern, flags); } catch (error) { }
    }

    return regex;
};

/**
 * Provides utility functions for working with RegexString type.
 */
export const RegexString = Object.freeze({
    toRegExp,
    /**
     * Clears the internal cache of RegExp objects.
     */
    clear: () => { regexMap = new Map<string, RegExp>(); }
});