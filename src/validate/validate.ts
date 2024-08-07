import { Schema } from "../Schema";
import { InferSchema } from "../Infer";
import { makeContext } from "./Context";
import { Result } from "../util/Result";
import { validateSchema } from "./validateSchema";


export const validate = <const F extends Schema>(value: any, schema: F): Result<InferSchema<F>, string[]> => {
    const result = validateSchema(value, schema, [], makeContext());

    return result === true ? Result.success(value) : Result.failure(result);
};
