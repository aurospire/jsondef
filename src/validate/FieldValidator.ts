import { Field } from "../Field";
import { Context, ValidationResult } from "./Context";


export type FieldValidator = (value: any, field: Field, path: string[], context: Context) => ValidationResult;
