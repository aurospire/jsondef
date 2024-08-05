import { CharSet, makeScanner, StringScanner } from "../util/parser";
import { JsondefTypes } from "./JsondefTypes";


const anySet = CharSet.range({ min: ' ', max: '\x7F' });
const charSet = anySet.and('\t').andNot('\'\\');
const charEscapeSet = CharSet.chars('nrt\\\'"0');
const regexFlagsSet = CharSet.chars('igmsuy');
const realSet = CharSet.chars('eE');
const signsSet = CharSet.chars('-+');

console.log('HAS QUOTE', charSet.has('\''));
const keywords = new Map<string, number>([
    ['null', JsondefTypes.NullToken],
    ['any', JsondefTypes.AnyToken],
    ['boolean', JsondefTypes.BooleanToken],
    ['this', JsondefTypes.ThisToken],
    ['root', JsondefTypes.RootToken],
    ['integer', JsondefTypes.IntegerToken],
    ['number', JsondefTypes.NumberToken],
    ['record', JsondefTypes.RecordToken],
    ['model', JsondefTypes.ModelToken],
    ['group', JsondefTypes.GroupToken],
    ['select', JsondefTypes.SelectToken],
    ['of', JsondefTypes.OfToken],
    ['string', JsondefTypes.StringToken],
    ['datetime', JsondefTypes.DatetimeToken],
    ['date', JsondefTypes.DateToken],
    ['time', JsondefTypes.TimeToken],
    ['uuid', JsondefTypes.UuidToken],
    ['base64', JsondefTypes.Base64Token],
    ['email', JsondefTypes.EmailToken],
    ['true', JsondefTypes.TrueToken],
    ['false', JsondefTypes.FalseToken],
]);

export function* lexJsonDef(data: string) {
    const scanner = makeScanner(data + '\0');

    while (!scanner.isEnd) {
        while (scanner.isIn(CharSet.Whitespace)) {
            scanner.consume();
        }

        scanner.mark();

        let id: number = JsondefTypes.Invalid;

        switch (scanner.peek()) {
            case '\0': scanner.consume(); id = JsondefTypes.Eof; break;

            case '|': scanner.consume(); id = JsondefTypes.Or; break;
            case '=': scanner.consume(); id = JsondefTypes.Exactly; break;
            case '(': scanner.consume(); id = JsondefTypes.Open; break;
            case ')': scanner.consume(); id = JsondefTypes.Close; break;
            case '[': scanner.consume(); id = JsondefTypes.ArrayOpen; break;
            case ']': scanner.consume(); id = JsondefTypes.ArrayClose; break;
            case '{': scanner.consume(); id = JsondefTypes.ObjectOpen; break;
            case '}': scanner.consume(); id = JsondefTypes.ObjectClose; break;
            case ',': scanner.consume(); id = JsondefTypes.Comma; break;
            case '<': {
                scanner.consume();

                if (scanner.is('=')) {
                    scanner.consume();
                    id = JsondefTypes.LessThanOrEqual;
                }
                else {
                    id = JsondefTypes.LessThan;
                }

                break;
            }
            case '>': {
                scanner.consume();

                if (scanner.is('=')) {
                    scanner.consume();
                    id = JsondefTypes.GreaterThanOrEqual;
                }
                else {
                    id = JsondefTypes.GreaterThan;
                }

                break;
            }
            case ':': scanner.consume(); id = JsondefTypes.RequiredIs; break;
            case '?': {
                scanner.consume();

                if (scanner.is(':')) {
                    scanner.consume();
                    id = JsondefTypes.OptionalIs;
                }
                break;
            }
            case '.': {
                scanner.consume();

                if (scanner.is('.')) scanner.consume();

                if (scanner.is('.')) {
                    scanner.consume();
                    id = JsondefTypes.Rest;
                }

                break;
            }

            default: {
                // Identifier
                if (scanner.is('_') || scanner.isLetter()) {
                    scanner.consume();

                    while (scanner.is('_') || scanner.isLetterOrDigit())
                        scanner.consume();

                    id = keywords.get(scanner.captured()) ?? JsondefTypes.Identifier;
                }
                // Number|Integer|Real
                else if (scanner.isDigit()) {
                    const result = scanNumber(scanner, JsondefTypes.Number);

                    if (result !== undefined) id = result;
                }
                else if (scanner.is('-')) {
                    scanner.consume();

                    if (scanner.isDigit()) {
                        const result = scanNumber(scanner, JsondefTypes.Integer);

                        if (result !== undefined) id = result;
                    }
                }
                // String
                else if (scanner.is('\'')) {
                    scanner.consume();

                    while (id === JsondefTypes.Invalid) {
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
                                    else {
                                        id = JsondefTypes.InvalidString;
                                    }
                                }
                            }
                            else {
                                id = JsondefTypes.InvalidString;
                            }
                        }
                        else if (scanner.is('\'')) {
                            scanner.consume();
                            id = JsondefTypes.String;
                        }
                        else {
                            id = JsondefTypes.InvalidString;
                        }
                    }
                }
                // Regex
                else if (scanner.is('/')) {

                }

                break;
            }
        }

        const token = scanner.token(id);

        scanner.commit();

        yield token;
    }
}

const scanNumber = (scanner: StringScanner, id: number): number | undefined => {
    scanner.consume();

    while (scanner.isDigit())
        scanner.consume();

    if (scanner.is('.')) {
        scanner.consume();

        if (!scanner.isDigit())
            return JsondefTypes.InvalidReal;

        while (scanner.isDigit())
            scanner.consume();

        if (scanner.isIn(realSet))
            return scanExponent(scanner);
        else
            return JsondefTypes.Real;
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
        return JsondefTypes.InvalidReal;

    while (scanner.isDigit())
        scanner.consume();

    return JsondefTypes.Real;
};
