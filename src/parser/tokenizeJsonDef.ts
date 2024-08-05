import { CharSet, makeScanner, StringScanner } from "../util/parser";
import { JsonDefTypes } from "./JsonDefTypes";

const anySet = CharSet.range({ min: ' ', max: '\x7E' });
const charSet = anySet.and('\t').andNot('\'\\');
const charEscapeSet = CharSet.chars('nrt\\\'"0');
const regexCharSet = anySet.and('\t').andNot('/\\');
const regexFlagsSet = CharSet.chars('igmsuy');
const realSet = CharSet.chars('eE');
const signsSet = CharSet.chars('-+');

const keywords = new Map<string, number>([
    ['null', JsonDefTypes.NullToken],
    ['any', JsonDefTypes.AnyToken],
    ['boolean', JsonDefTypes.BooleanToken],
    ['this', JsonDefTypes.ThisToken],
    ['root', JsonDefTypes.RootToken],
    ['integer', JsonDefTypes.IntegerToken],
    ['number', JsonDefTypes.NumberToken],
    ['record', JsonDefTypes.RecordToken],
    ['model', JsonDefTypes.ModelToken],
    ['group', JsonDefTypes.GroupToken],
    ['select', JsonDefTypes.SelectToken],
    ['of', JsonDefTypes.OfToken],
    ['string', JsonDefTypes.StringToken],
    ['datetime', JsonDefTypes.DatetimeToken],
    ['date', JsonDefTypes.DateToken],
    ['time', JsonDefTypes.TimeToken],
    ['uuid', JsonDefTypes.UuidToken],
    ['base64', JsonDefTypes.Base64Token],
    ['email', JsonDefTypes.EmailToken],
    ['true', JsonDefTypes.TrueToken],
    ['false', JsonDefTypes.FalseToken],
]);

export function* tokenizeJsonDef(data: string) {
    const scanner = makeScanner(data + '\0');

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

                // Invalid Token
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

        if (scanner.isIn(realSet))
            return scanExponent(scanner);

        else
            return JsonDefTypes.Real;
    }
    else if (scanner.isIn(realSet)) {
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
