import { Schema } from "../Schema";
import { InferSchema } from "../Infer";
import { makeContext } from "./Context";
import { Result } from "../util/Result";
import { validateSchema } from "./validateSchema";

/**
 * Validates a value against a given schema.
 * 
 * @template S - The type of the schema
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
 * const result = validate({ name: "John", age: 30 }, userSchema);
 * if (result.success) {
 *   console.log("Valid user:", result.value);
 * } else {
 *   console.log("Validation errors:", result.issues);
 * }
 */
export const validate = <const S extends Schema>(value: any, schema: S): Result<InferSchema<S>, string[]> => {
    const result = validateSchema(value, schema, [], makeContext());

    return result === true ? Result.success(value) : Result.failure(result);
};