import { Schema, SchemaObject, ModelSchema, ObjectSchema } from "../Schema";
import { Issue } from "./Result";

export type ValidationResult = true | Issue[];

export type ResultCache = Map<any, ValidationResult>;

export type SchemaCache = Map<Schema, ResultCache>;

export type Context = {
    cache: SchemaCache;
    global?: SchemaObject;
    root?: ModelSchema | ObjectSchema;
    local?: ModelSchema | ObjectSchema;
};

export const newResultCache = (): ResultCache => new Map<any, ValidationResult>();

export const newSchemaCache = (): SchemaCache => new Map<Schema, ResultCache>();

export const makeContext = (
    cache: Context['cache'] = newSchemaCache(),
    global?: Context['global'],
    root?: Context['root'],
    local?: Context['local']
) => ({ cache, global, root, local });
