import { CharSet, StringScanner } from "../util";
import { JsonDefType } from "./JsonDefType";

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
    ['null', JsonDefType.NullKeyword],
    ['any', JsonDefType.AnyKeyword],
    ['boolean', JsonDefType.BooleanKeyword],
    ['this', JsonDefType.ThisKeyword],
    ['root', JsonDefType.RootKeyword],
    ['integer', JsonDefType.IntegerKeyword],
    ['number', JsonDefType.NumberKeyword],
    ['record', JsonDefType.RecordKeyword],
    ['model', JsonDefType.ModelKeyword],
    ['group', JsonDefType.GroupKeyword],
    ['select', JsonDefType.SelectKeyword],
    ['of', JsonDefType.OfKeyword],
    ['string', JsonDefType.StringKeyword],
    ['datetime', JsonDefType.DatetimeKeyword],
    ['date', JsonDefType.DateKeyword],
    ['time', JsonDefType.TimeKeyword],
    ['uuid', JsonDefType.UuidKeyword],
    ['base64', JsonDefType.Base64Keyword],
    ['email', JsonDefType.EmailKeyword],
    ['true', JsonDefType.TrueKeyword],
    ['false', JsonDefType.FalseKeyword],
]);

// Single-character tokens
const singleCharTokens = new Map<string, number>([
    ['\0', JsonDefType.Eof],
    ['|', JsonDefType.Or],
    ['=', JsonDefType.Exactly],
    ['(', JsonDefType.Open],
    [')', JsonDefType.Close],
    ['[', JsonDefType.ArrayOpen],
    [']', JsonDefType.ArrayClose],
    ['{', JsonDefType.ObjectOpen],
    ['}', JsonDefType.ObjectClose],
    [',', JsonDefType.Comma],
    [':', JsonDefType.RequiredIs],
]);

export function* tokenizeJsonDef(data: string) {
    const scanner = new StringScanner(data);

    while (true) {
        scanner.consumeWhileIn(CharSet.Whitespace);

        if (scanner.isEnd) return;

        scanner.mark();

        const char = scanner.peek()!;

        let id = JsonDefType.Invalid;

        if (singleCharTokens.has(char)) {
            id = singleCharTokens.get(char)!;

            scanner.consume();
        }
        else {
            switch (char) {
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
};


const scanLessThan = (scanner: StringScanner): number => {
    scanner.consume();
    return scanner.consumeIf('=') ? JsonDefType.LessThanOrEqual : JsonDefType.LessThan;
};

const scanGreaterThan = (scanner: StringScanner): number => {
    scanner.consume();
    return scanner.consumeIf('=') ? JsonDefType.GreaterThanOrEqual : JsonDefType.GreaterThan;
};

const scanOptionalIs = (scanner: StringScanner): number => {
    scanner.consume();
    return scanner.consumeIf(':') ? JsonDefType.OptionalIs : JsonDefType.Invalid;
};

const scanRest = (scanner: StringScanner): number => {
    scanner.consume();
    return scanner.consumeIf('.') && scanner.consumeIf('.') ? JsonDefType.Rest : JsonDefType.Invalid;
};

const scanIdentifierOrKeyword = (scanner: StringScanner): number => {
    scanner.consume();
    scanner.consumeWhileIn(charSets.identifier);
    return keywords.get(scanner.captured()) ?? JsonDefType.Identifier;
};

const scanNumber = (scanner: StringScanner): number => {
    const isNegative = scanner.consumeIf('-');

    let id = isNegative ? JsonDefType.Integer : JsonDefType.Number;

    scanner.consumeWhileIn(CharSet.Digit);

    if (scanner.consumeIf('.')) {

        if (!scanner.isIn(CharSet.Digit))
            return JsonDefType.InvalidReal;

        scanner.consumeWhileIn(CharSet.Digit);

        id = JsonDefType.Real;
    }

    if (scanner.consumeIfIn(charSets.exponent)) {

        scanner.consumeIfIn(charSets.signs);

        if (!scanner.isIn(CharSet.Digit)) return JsonDefType.InvalidReal;

        scanner.consumeWhileIn(CharSet.Digit);

        id = JsonDefType.Real;
    }

    return id;
};

const scanString = (scanner: StringScanner): number => {
    scanner.consume(); // Opening quote

    while (!scanner.isEnd) {
        if (scanner.consumeIfIn(charSets.char)) { }

        // Escape
        else if (scanner.consumeIf('\\')) {

            if (scanner.consumeIfIn(charSets.charEscape)) { }
            else if (scanner.consumeIf('x')) {
                if (!scanner.consumeIfIn(charSets.hex) || !scanner.consumeIfIn(charSets.hex))
                    return JsonDefType.InvalidString;
            }
            else {
                return JsonDefType.InvalidString;
            }
        }
        // End Quote
        else if (scanner.consumeIf('\'')) {
            return JsonDefType.String;
        }
        else {
            return JsonDefType.InvalidString;
        }
    }

    return JsonDefType.InvalidString;
};

const scanRegex = (scanner: StringScanner): number => {
    scanner.consume(); // Opening slash

    let started = false;

    while (!scanner.isEnd) {
        if (scanner.consumeIfIn(charSets.regexChar)) {
            started = true;
        }
        // Escape
        else if (scanner.consumeIf('\\')) {
            started = true;

            if (!scanner.consumeIfIn(charSets.any))
                return JsonDefType.InvalidRegex;
        }
        // End
        else if (scanner.consumeIf('/')) {
            if (!started) break;

            scanner.consumeWhileIn(charSets.regexFlags);

            return JsonDefType.Regex;
        }
        else {
            break;
        }
    }

    return JsonDefType.InvalidRegex;
};