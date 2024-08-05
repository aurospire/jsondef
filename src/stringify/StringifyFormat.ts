// Types and constants

export type StringifyFormat = {
    indent: string;
    newline: string;
    spacing: string;
};
export const condensedFormat = (format: Partial<StringifyFormat>): StringifyFormat => ({
    indent: '',
    spacing: '',
    newline: '',
    ...format
});
export const prettifyFormat = (format: Partial<StringifyFormat>): StringifyFormat => ({
    indent: '  ',
    spacing: ' ',
    newline: '\n',
    ...format
});
