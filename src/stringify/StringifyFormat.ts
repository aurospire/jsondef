/** 
 * Defines the format options for stringifying schema objects.
 */
export type StringifyFormat = {
    /** The string used for indentation. */
    indent: string;
    /** The string used for line breaks. */
    newline: string;
    /** The string used for spacing between elements. */
    spacing: string;
};

/**
 * Creates a condensed format for stringification.
 * @param format Partial format options to override defaults.
 * @returns A complete StringifyFormat object with condensed defaults.
 */
export const condensedFormat = (format: Partial<StringifyFormat>): StringifyFormat => ({
    indent: '',
    spacing: '',
    newline: '',
    ...format
});

/**
 * Creates a prettified format for stringification.
 * @param format Partial format options to override defaults.
 * @returns A complete StringifyFormat object with prettified defaults.
 */
export const prettifyFormat = (format: Partial<StringifyFormat>): StringifyFormat => ({
    indent: '  ',
    spacing: ' ',
    newline: '\n',
    ...format
});