import { Scanner } from "./Scanner";
import { StringMark, Token } from "./Token";

/**
 * A Scanner for processing strings with line and column tracking.
 * Extends the base Scanner class with string-specific functionality.
 */
export class StringScanner extends Scanner<string, string, string, StringMark> {
    /**
     * Creates a new StringScanner instance.
     * @param from The source string or another StringScanner to initialize from.
     */
    constructor(from: string | StringScanner) { super(from); }

    /**
     * Gets the current line number from the mark.
     * @protected
     */
    protected get line() { return this.getOfMark('line'); }

    /**
     * Gets the current column number from the mark.
     * @protected
     */
    protected get column() { return this.getOfMark('column'); }

    /**
     * Creates the initial mark for the scanner.
     * @returns A StringMark object with initial position, line, and column set to 0.
     */
    protected override initialMark(): StringMark { return { position: 0, line: 0, column: 0 }; }

    /**
     * Converts a string value to its comparable form (itself in this case).
     * @param value The string value to convert, or undefined.
     * @returns The input string, or an empty string if the input is undefined.
     */
    protected override comparable(value: string | undefined): string { return value as string; }

    /**
     * Handles the consumption of characters by updating the mark's position, line, and column.
     * @param data The string being scanned.
     * @param mark The current StringMark to update.
     * @param count The number of characters consumed.
     */
    protected override onConsume(data: string, mark: StringMark, count: number): void {
        let { position, line, column } = mark;

        for (let i = 0; i < count; i++) {
            const current = data[position++];

            const newline = current === '\n' || (current === '\r' && data[position] !== '\n');

            if (newline) {
                line++;
                column = 0;
            }
            else {
                column++;
            }
        }

        mark.position = position;
        mark.line = line;
        mark.column = column;
    }

    /**
     * Creates a clone of the current StringScanner.
     * @returns A new StringScanner instance with the same state as the current one.
     */
    override clone(): StringScanner { return new StringScanner(this); }

    /**
     * Creates a Token from the current scanner state.
     * @param id The type identifier for the token.
     * @param data Optional additional data to associate with the token.
     * @returns A Token object representing the current scanner state.
     */
    token(id: number, data?: any): Token { return { type: id, ...this.extract(), data }; }
}