import { Schema } from "../Schema";
import { StringifyFormat, condensedFormat, prettifyFormat } from "./StringifyFormat";
import { stringifySchema } from "./stringifySchema";

// Main stringify function
export const stringify = (schema: Schema, format: Partial<StringifyFormat> = {}, condensed: boolean = false): string => {
    const stringifyFormat = condensed ? condensedFormat(format) : prettifyFormat(format);

    return stringifySchema(schema, stringifyFormat);
};
