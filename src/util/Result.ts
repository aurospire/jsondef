export type Issue<O> = { on: O, message: string; };

export type ResultSuccess<T> = { success: true; value: T; };

export type ResultFailure<O> = { success: false; issues: Issue<O>[]; };

export type Result<T, O> = ResultSuccess<T> | ResultFailure<O>;

export const Result = Object.freeze({
    success: <T>(value: T): ResultSuccess<T> => ({ success: true, value }),
    failure: <O>(issues: Issue<O>[]): ResultFailure<O> => ({ success: false, issues })
});