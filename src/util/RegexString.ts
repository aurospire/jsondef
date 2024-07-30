export type RegexString = `/${string}/${string}`;

let regexMap: Map<string, RegExp> = new Map<string, RegExp>();

const toRegExp = (regexString: RegexString): RegExp | undefined => {
    let regex = regexMap.get(regexString);

    if (!regex) {
        const [match, pattern, flags] = regexString.match(/\/(.+)\/(.*)/) ?? [];

        if (match)
            try { regex = new RegExp(pattern, flags); } catch (error) { }
    }

    return regex;
};

export const RegexString = Object.freeze({
    toRegExp,
    clear: () => { regexMap = new Map<string, RegExp>(); }
});