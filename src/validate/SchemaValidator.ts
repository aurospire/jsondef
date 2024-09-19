import { Schema } from "../Schema";
import { Context, ValidationResult } from "./Context";

export type SchemaValidator = (value: any, schema: Schema, path: string[], context: Context) => ValidationResult;
