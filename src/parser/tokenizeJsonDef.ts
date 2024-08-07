import { CharSet, StringScanner } from "../util";
import { JsonDefTypes } from "./JsonDefTypes";

// Character sets
const charSets = {
    any: CharSet.range({ min: ' ', max: '\x7E' }).and('\t'),
    char: CharSet.range({ min: ' ', max: '\x7E' }).and('\t').andNot('\'\\'),
    charEscape: CharSet.chars('nrt\\\'"0'),
    regexChar: CharSet.range({ min: ' ', max: '\x7E' }).and('\t').andNot('/\\'),
    regexFlags: CharSet.chars('igmsuy'),
    exponent: CharSet.chars('eE'),
    signs: CharSet.chars('-+'),
    hex: CharSet.Digit.and(CharSet.range({ min: 'a', max: 'f' })).and(CharSet.range({ min: 'A', max: 'F' })),
    identifier: CharSet.LetterOrDigit.and('_')
};

// Keywords map
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

// Single-character tokens
const singleCharTokens = new Map<string, number>([
    ['\0', JsonDefTypes.Eof],
    ['|', JsonDefTypes.Or],
    ['=', JsonDefTypes.Exactly],
    ['(', JsonDefTypes.Open],
    [')', JsonDefTypes.Close],
    ['[', JsonDefTypes.ArrayOpen],
    [']', JsonDefTypes.ArrayClose],
    ['{', JsonDefTypes.ObjectOpen],
    ['}', JsonDefTypes.ObjectClose],
    [',', JsonDefTypes.Comma],
    [':', JsonDefTypes.RequiredIs],
]);

export function* tokenizeJsonDef(data: string) {
    const scanner = new StringScanner(data + '\0');

    while (!scanner.isEnd) {
        scanner.consumeWhileIn(CharSet.Whitespace);

        scanner.mark();

        const char = scanner.peek()!;

        let id = JsonDefTypes.Invalid;

        if (singleCharTokens.has(char)) {
            id = singleCharTokens.get(char)!;

            scanner.consume();
        }
        else {
            switch (char) {
                // case '&':
                //     id = scanAnd(scanner); break;
                case '<':
                    id = scanLessThan(scanner); break;
                case '>':
                    id = scanGreaterThan(scanner); break;
                case '?':
                    id = scanOptionalIs(scanner); break;
                case '.':
                    id = scanRest(scanner); break;
                default:
                    if (scanner.is('_') || scanner.isIn(CharSet.Letter))
                        id = scanIdentifierOrKeyword(scanner);
                    else if (scanner.isIn(CharSet.Digit) || scanner.is('-'))
                        id = scanNumber(scanner);
                    else if (scanner.is('\''))
                        id = scanString(scanner);
                    else if (scanner.is('/'))
                        id = scanRegex(scanner);
                    // Invalid character
                    else
                        scanner.consume();
            }
        }

        yield scanner.token(id);

        scanner.commit();
    }
}

// function scanAnd(scanner: StringScanner): number {
//     scanner.consume();
//     return scanner.consumeIf('&') ? JsonDefTypes.And : JsonDefTypes.Invalid;
// }

function scanLessThan(scanner: StringScanner): number {
    scanner.consume();
    return scanner.consumeIf('=') ? JsonDefTypes.LessThanOrEqual : JsonDefTypes.LessThan;
}

function scanGreaterThan(scanner: StringScanner): number {
    scanner.consume();
    return scanner.consumeIf('=') ? JsonDefTypes.GreaterThanOrEqual : JsonDefTypes.GreaterThan;
}

function scanOptionalIs(scanner: StringScanner): number {
    scanner.consume();
    return scanner.consumeIf(':') ? JsonDefTypes.OptionalIs : JsonDefTypes.Invalid;
}

function scanRest(scanner: StringScanner): number {
    scanner.consume();
    return scanner.consumeIf('.') && scanner.consumeIf('.') ? JsonDefTypes.Rest : JsonDefTypes.Invalid;
}

function scanIdentifierOrKeyword(scanner: StringScanner): number {
    scanner.consume();
    scanner.consumeWhileIn(charSets.identifier);
    return keywords.get(scanner.captured()) ?? JsonDefTypes.Identifier;
}

function scanNumber(scanner: StringScanner): number {
    const isNegative = scanner.consumeIf('-');

    let id = isNegative ? JsonDefTypes.Integer : JsonDefTypes.Number;

    scanner.consumeWhileIn(CharSet.Digit);

    if (scanner.consumeIf('.')) {

        if (!scanner.isIn(CharSet.Digit))
            return JsonDefTypes.InvalidReal;

        scanner.consumeWhileIn(CharSet.Digit);

        id = JsonDefTypes.Real;
    }

    if (scanner.consumeIfIn(charSets.exponent)) {

        scanner.consumeIfIn(charSets.signs);

        if (!scanner.isIn(CharSet.Digit)) return JsonDefTypes.InvalidReal;

        scanner.consumeWhileIn(CharSet.Digit);

        id = JsonDefTypes.Real;
    }

    return id;
}

function scanString(scanner: StringScanner): number {
    scanner.consume(); // Opening quote

    while (!scanner.isEnd) {
        if (scanner.isIn(charSets.char)) {
            scanner.consume();
        }
        // Escape
        else if (scanner.is('\\')) {
            scanner.consume();

            if (scanner.isIn(charSets.charEscape)) {
                scanner.consume();
            }
            else if (scanner.is('x')) {
                scanner.consume();

                if (!scanner.consumeIfIn(charSets.hex) || !scanner.consumeIfIn(charSets.hex))
                    return JsonDefTypes.InvalidString;
            }
            else {
                return JsonDefTypes.InvalidString;
            }
        }
        // End Quote
        else if (scanner.consumeIf('\'')) {
            return JsonDefTypes.String;
        }
        else {
            return JsonDefTypes.InvalidString;
        }
    }

    return JsonDefTypes.InvalidString;
}

function scanRegex(scanner: StringScanner): number {
    scanner.consume(); // Opening slash

    let started = false;

    while (!scanner.isEnd) {
        if (scanner.isIn(charSets.regexChar)) {
            scanner.consume();

            started = true;
        }
        // Escape
        else if (scanner.is('\\')) {
            scanner.consume();

            started = true;

            if (!scanner.consumeIfIn(charSets.any))
                return JsonDefTypes.InvalidRegex;
        }
        // End
        else if (scanner.is('/')) {
            scanner.consume();

            if (!started) break;

            scanner.consumeWhileIn(charSets.regexFlags);

            return JsonDefTypes.Regex;
        }
        else {
            break;
        }
    }

    return JsonDefTypes.InvalidRegex;
}