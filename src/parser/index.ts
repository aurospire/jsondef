import { CharSet, makeScanner, Token } from "../util/parser";
import { JsondefTypes } from "./JsondefTypes";

const whitespace = new Set([' ', '\t', '\r', 'n']);
export function* lex(data: string) {
    const scanner = makeScanner(data);

    scanner.mark();

    let id: number = JsondefTypes.Invalid;

    while (!scanner.isEnd) {
        while (scanner.isIn(whitespace)) {

        }

        switch (scanner.peek()) {
            case '|':
                scanner.consume(); id = JsondefTypes.Or; break;
            case '=':
                scanner.consume(); id = JsondefTypes.Exactly; break;
        }

        const token = scanner.token(id);

        scanner.commit();

        yield token;
    }

    // need to do this more elegantly?
    yield { ...scanner.token(JsondefTypes.Eof), value: '\0' };
}