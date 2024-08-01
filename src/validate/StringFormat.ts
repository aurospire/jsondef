import { StringFormat } from "../Schema";

const stringSchemaFormats = new Set<string>(['date', 'time', 'datetime', 'uuid', 'base64', 'email']);

export const isStringFormat = (value: string): value is StringFormat => stringSchemaFormats.has(value);
