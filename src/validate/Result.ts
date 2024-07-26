
export type Issue = { path: string[]; issue: string; };

export type ResultSuccess<T> = { success: true; value: T; };

export type ResultFailure = { success: false; issues: Issue[]; };

export type Result<T> = ResultSuccess<T> | ResultFailure;

export const Result = Object.freeze({
    success: <T>(value: T): ResultSuccess<T> => ({ success: true, value }),
    failure: (issues: Issue[]): ResultFailure => ({ success: false, issues })
});