import { StringSchemaFormat } from "./Schema";

const stringSchemaFormats = new Set<string>(['date', 'time', 'datetime', 'uuid', 'base64', 'email']);

export const isStringFormat = (value: string): value is StringSchemaFormat => stringSchemaFormats.has(value);
