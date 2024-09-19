import { Schema } from "../Schema";
import { InferSchema } from "../Infer";
import { makeContext } from "./Context";
import { Result, ResultError } from "../util/Result";
import { validateSchema } from "./validateSchema";

/**
 * Attempts to validate a value against a given schema.
 * 
 * @template S - The type of the schema, constrained to be a subtype of Schema.
 * @param value - The value to validate.
 * @param schema - The schema to validate against.
 * @returns A Result object containing either the validated value (of type InferSchema<S>) or an array of error messages.
 * 
 * @example
 * const userSchema = objectSchema({
 *   name: stringSchema(),
 *   age: integerSchema(x => x.min(0))
 * });
 * 
 * const result = tryValidate({ name: "John", age: 30 }, userSchema);
 * if (result.success) {
 *   console.log("Valid user:", result.value);
 * } else {
 *   console.log("Validation errors:", result.issues);
 * }
 */
export const tryValidate = <const S extends Schema>(value: any, schema: S): Result<InferSchema<S>, string[]> => {
    const result = validateSchema(value, schema, [], makeContext());

    return result === true ? Result.success(value) : Result.failure(result);
};

/**
 * Validates a value against a given schema.
 * 
 * @template S - The type of the schema, constrained to be a subtype of Schema.
 * @param value - The value to validate.
 * @param schema - The schema to validate against.
 * @returns The validated value of type InferSchema<S>.
 * @throws {ResultError<string[]>} If validation fails, throws an error with details about the validation issues.
 * 
 * @example
 * const userSchema = objectSchema({
 *   name: stringSchema(),
 *   age: integerSchema(x => x.min(0))
 * });
 * 
 * try {
 *   const validUser = validate({ name: "John", age: 30 }, userSchema);
 *   console.log("Valid user:", validUser);
 * } catch (error) {
 *   if (error instanceof ResultError) {
 *     console.log("Validation errors:", error.issues);
 *   }
 * }
 */
export const validate = <const S extends Schema>(value: any, schema: S): InferSchema<S> => {
    const result = tryValidate(value, schema);

    if (result.success)
        return result.value;
    else
        throw new ResultError<string[]>('Schema Validation Error', result.issues);
};