import { Mark, Segment } from "./Scanner";

/**
 * Extends the basic Mark type with line and column information for string parsing.
 */
export type StringMark = Mark & {
    /** The line number in the string being parsed. */
    line: number;
    /** The column number in the current line being parsed. */
    column: number;
};

/**
 * Represents a token extracted from a string during parsing.
 * Extends the Segment type with additional token-specific properties.
 */
export type Token = Segment<string, StringMark> & {
    /** The type of the token, represented as a number. */
    type: number;
    /** Optional additional data associated with the token. */
    data?: any;
};