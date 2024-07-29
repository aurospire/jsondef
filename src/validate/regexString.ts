import { RegexString } from "../Schema";

const regexMap: Map<string, RegExp> = new Map<string, RegExp>();

export const regexString = (regexString: RegexString): RegExp | undefined => {
    let regex = regexMap.get(regexString);

    if (!regex) {
        const [match, pattern, flags] = regexString.match(/\/(.+)\/(.*)/) ?? [];

        if (match)
            try { regex = new RegExp(pattern, flags); } catch (error) { }
    }

    return regex;
};
