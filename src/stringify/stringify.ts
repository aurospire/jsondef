import { Schema } from "../Schema";
import { StringifyFormat, condensedFormat, prettifyFormat } from "./StringifyFormat";
import { stringifySchema } from "./stringifySchema";

/**
 * Converts a Schema object to its string representation.
 * 
 * @param schema - The Schema object to stringify.
 * @param format - Optional partial StringifyFormat object to customize the output format.
 * @param condensed - Optional boolean flag to use condensed format (default is false).
 * @returns A string representation of the input Schema.
 */
export const stringify = (schema: Schema, format: Partial<StringifyFormat> = {}, condensed: boolean = false): string => {
    const stringifyFormat = condensed ? condensedFormat(format) : prettifyFormat(format);

    return stringifySchema(schema, stringifyFormat);
};