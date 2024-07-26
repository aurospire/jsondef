import { Field } from "../Field";
import { InferField } from "../Infer";
import { makeContext } from "./Context";
import { Result } from "./Result";
import { validateField } from "./validateField";


export const validate = <const F extends Field>(value: any, field: F): Result<InferField<F>> => {
    const result = validateField(value, field, [], makeContext());

    return result === true ? Result.success(value) : Result.failure(result);
};
