import { StringSchemaPattern } from "./Schema";

const stringSchemaPatterns = new Set<string>(['date', 'time', 'datetime', 'uuid', 'base64', 'email']);

export const isStringPattern = (value: string): value is StringSchemaPattern => stringSchemaPatterns.has(value);
