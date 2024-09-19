import { Scanner, Mark } from "./Scanner";
import { Token } from "./Token";

/**
 * A Scanner for processing arrays of Tokens.
 */
export class TokenScanner extends Scanner<Token, Token[], number> {
    /**
     * Creates a new TokenScanner instance.
     * @param from The source Token array or another TokenScanner to initialize from.
     */
    constructor(from: Token[] | TokenScanner) { super(from); }

    /**
     * Creates the initial mark for the scanner.
     * @returns A Mark object with the initial position set to 0.
     */
    protected override initialMark(): Mark { return { position: 0 }; }

    /**
     * Converts a Token to its comparable form (its type).
     * @param value The Token to convert or undefined.
     * @returns The type of the Token as a number or undefined.
     */
    protected override comparable(value: Token | undefined) { return value?.type as number; }

    /**
     * Handles the consumption of Tokens by updating the mark's position.
     * @param data The array of Tokens being scanned (unused for this).
     * @param mark The current mark to update.
     * @param count The number of Tokens consumed.
     */
    protected override onConsume(data: Token[], mark: Mark, count: number): void { mark.position += count; }

    /**
     * Creates a clone of the current TokenScanner.
     * @returns A new TokenScanner instance with the same state as the current one.
     */
    override clone(): TokenScanner { return new TokenScanner(this); }

    /**
     * Retrieves the value of a Token at a specified offset from the current position.
     * @param offset The offset from the current position. Defaults to 0.
     * @returns The value of the Token at the specified offset, or undefined if no Token exists at that position.
     */
    value(offset: number = 0): string | undefined { return this.peek(offset)?.value; }

    /**
     * Retrieves the type of a Token at a specified offset from the current position.
     * @param offset The offset from the current position. Defaults to 0.
     * @returns The type of the Token at the specified offset, or undefined if no Token exists at that position.
     */
    type(offset: number = 0): number | undefined { return this.peek(offset)?.type; }
}