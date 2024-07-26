import { Field, FieldObject, ModelField, ObjectField } from "../Field";
import { Issue } from "./Result";

export type ValidationResult = true | Issue[];

export type ResultCache = Map<any, ValidationResult>;

export type FieldCache = Map<Field, ResultCache>;

export type Context = {
    cache: FieldCache;
    global?: FieldObject;
    root?: ModelField | ObjectField;
    local?: ModelField | ObjectField;
};

export const newResultCache = (): ResultCache => new Map<any, ValidationResult>();

export const newFieldCache = (): FieldCache => new Map<Field, ResultCache>();

export const makeContext = (
    cache: Context['cache'] = newFieldCache(),
    global?: Context['global'],
    root?: Context['root'],
    local?: Context['local']
) => ({ cache, global, root, local });
