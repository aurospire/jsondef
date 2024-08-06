import { CharSet, StringScanner } from "../util";
import { JsonDefTypes } from "./JsonDefTypes";

const anySet = CharSet.range({ min: ' ', max: '\x7E' }).and('\t');
const charSet = anySet.andNot('\'\\');
const charEscapeSet = CharSet.chars('nrt\\\'"0');
const regexCharSet = anySet.andNot('/\\');
const regexFlagsSet = CharSet.chars('igmsuy');
const exponentSet = CharSet.chars('eE');
const signsSet = CharSet.chars('-+');

const keywords = new Map<string, number>([
    ['null', JsonDefTypes.NullKeyword],
    ['any', JsonDefTypes.AnyKeyword],
    ['boolean', JsonDefTypes.BooleanKeyword],
    ['this', JsonDefTypes.ThisKeyword],
    ['root', JsonDefTypes.RootKeyword],
    ['integer', JsonDefTypes.IntegerKeyword],
    ['number', JsonDefTypes.NumberKeyword],
    ['record', JsonDefTypes.RecordKeyword],
    ['model', JsonDefTypes.ModelKeyword],
    ['group', JsonDefTypes.GroupKeyword],
    ['select', JsonDefTypes.SelectKeyword],
    ['of', JsonDefTypes.OfKeyword],
    ['string', JsonDefTypes.StringKeyword],
    ['datetime', JsonDefTypes.DatetimeKeyword],
    ['date', JsonDefTypes.DateKeyword],
    ['time', JsonDefTypes.TimeKeyword],
    ['uuid', JsonDefTypes.UuidKeyword],
    ['base64', JsonDefTypes.Base64Keyword],
    ['email', JsonDefTypes.EmailKeyword],
    ['true', JsonDefTypes.TrueKeyword],
    ['false', JsonDefTypes.FalseKeyword],
]);

export function* tokenizeJsonDef(data: string) {
    const scanner = new StringScanner(data + '\0');

    while (!scanner.isEnd) {
        while (scanner.isIn(CharSet.Whitespace)) {
            scanner.consume();
        }

        scanner.mark();

        let id: number = JsonDefTypes.Invalid;

        switch (scanner.peek()) {
            case '\0': scanner.consume(); id = JsonDefTypes.Eof; break;
            case '|': scanner.consume(); id = JsonDefTypes.Or; break;
            case '=': scanner.consume(); id = JsonDefTypes.Exactly; break;
            case '(': scanner.consume(); id = JsonDefTypes.Open; break;
            case ')': scanner.consume(); id = JsonDefTypes.Close; break;
            case '[': scanner.consume(); id = JsonDefTypes.ArrayOpen; break;
            case ']': scanner.consume(); id = JsonDefTypes.ArrayClose; break;
            case '{': scanner.consume(); id = JsonDefTypes.ObjectOpen; break;
            case '}': scanner.consume(); id = JsonDefTypes.ObjectClose; break;
            case ',': scanner.consume(); id = JsonDefTypes.Comma; break;
            case '&': {
                scanner.consume();

                if (scanner.is('&')) {
                    scanner.consume();
                    id = JsonDefTypes.And;
                }
                break;
            }
            case '<': {
                scanner.consume();

                if (scanner.is('=')) {
                    scanner.consume();
                    id = JsonDefTypes.LessThanOrEqual;
                }
                else {
                    id = JsonDefTypes.LessThan;
                }

                break;
            }
            case '>': {
                scanner.consume();

                if (scanner.is('=')) {
                    scanner.consume();
                    id = JsonDefTypes.GreaterThanOrEqual;
                }
                else {
                    id = JsonDefTypes.GreaterThan;
                }

                break;
            }
            case ':': scanner.consume(); id = JsonDefTypes.RequiredIs; break;
            case '?': {
                scanner.consume();

                if (scanner.is(':')) {
                    scanner.consume();
                    id = JsonDefTypes.OptionalIs;
                }
                break;
            }
            case '.': {
                scanner.consume();

                if (scanner.is('.')) scanner.consume();

                if (scanner.is('.')) {
                    scanner.consume();
                    id = JsonDefTypes.Rest;
                }

                break;
            }

            default: {
                // Keyword | Identifier
                if (scanner.is('_') || scanner.isLetter()) {
                    scanner.consume();

                    while (scanner.is('_') || scanner.isLetterOrDigit())
                        scanner.consume();

                    id = keywords.get(scanner.captured()) ?? JsonDefTypes.Identifier;
                }


                // Number|Integer|Real
                else if (scanner.isDigit()) {
                    id = scanNumber(scanner, JsonDefTypes.Number);
                }
                else if (scanner.is('-')) {
                    scanner.consume();

                    if (scanner.isDigit())
                        id = scanNumber(scanner, JsonDefTypes.Integer);
                }


                // String
                else if (scanner.is('\'')) {
                    id = scanString(scanner);
                }


                // Regex
                else if (scanner.is('/')) {
                    id = scanRegex(scanner);
                }

                // Invalid Keyword
                else {
                    scanner.consume();
                }

                break;
            }
        }

        const token = scanner.token(id);

        scanner.commit();

        yield token;
    }
}

const scanNumber = (scanner: StringScanner, id: number): number => {
    scanner.consume();

    while (scanner.isDigit())
        scanner.consume();

    if (scanner.is('.')) {
        scanner.consume();

        if (!scanner.isDigit())
            return JsonDefTypes.InvalidReal;

        while (scanner.isDigit())
            scanner.consume();

        if (scanner.isIn(exponentSet))
            return scanExponent(scanner);

        else
            return JsonDefTypes.Real;
    }
    else if (scanner.isIn(exponentSet)) {
        return scanExponent(scanner);
    }
    else {
        return id;
    }
};

const scanExponent = (scanner: StringScanner): number => {
    scanner.consume();

    if (scanner.isIn(signsSet))
        scanner.consume();

    if (!scanner.isDigit())
        return JsonDefTypes.InvalidReal;

    while (scanner.isDigit())
        scanner.consume();

    return JsonDefTypes.Real;
};

const scanString = (scanner: StringScanner): number => {
    scanner.consume();

    while (true) {

        // Valid Char
        if (scanner.isIn(charSet)) {
            scanner.consume();
        }

        // Escapes
        else if (scanner.is('\\')) {
            scanner.consume();

            if (scanner.isIn(charEscapeSet)) {
                scanner.consume();
            }

            // \xXX
            else if (scanner.is('x')) {
                scanner.consume();

                for (let i = 0; i < 2; i++) {
                    if (scanner.isHex())
                        scanner.consume();
                    else
                        return JsonDefTypes.InvalidString;
                }
            }
            else {
                return JsonDefTypes.InvalidString;
            }
        }

        // End Quote
        else if (scanner.is('\'')) {
            scanner.consume();
            return JsonDefTypes.String;
        }

        // Error
        else {
            return JsonDefTypes.InvalidString;
        }
    }
};

const scanRegex = (scanner: StringScanner): number => {
    scanner.consume();

    let started = false;

    while (true) {
        if (scanner.isIn(regexCharSet)) {
            started = true;

            scanner.consume();
        }
        else if (scanner.is('\\')) {
            started = true;

            scanner.consume();

            if (scanner.isIn(anySet))
                scanner.consume();
        }
        else if (scanner.is('/')) {
            scanner.consume();

            if (started)
                break;

            else
                return JsonDefTypes.InvalidRegex;

        }
        else {
            return JsonDefTypes.InvalidRegex;
        }
    }

    while (scanner.isIn(regexFlagsSet))
        scanner.consume();

    return JsonDefTypes.Regex;
};
