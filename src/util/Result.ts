/**
 * Represents an issue or error associated with a specific object or context.
 * @template O The type of the object or context the issue is associated with.
 */
export type Issue<O> = { on: O, message: string; };

/**
 * Represents a successful result of an operation.
 * @template T The type of the value returned on success.
 */
export type ResultSuccess<T> = { success: true; value: T; };

/**
 * Represents a failed result of an operation.
 * @template O The type of the object or context associated with the issues.
 */
export type ResultFailure<O> = { success: false; issues: Issue<O>[]; };

/**
 * Represents the result of an operation that can either succeed or fail.
 * @template T The type of the value returned on success.
 * @template O The type of the object or context associated with issues in case of failure.
 */
export type Result<T, O> = ResultSuccess<T> | ResultFailure<O>;

/**
 * Provides utility functions for creating Result objects.
 */
export const Result = Object.freeze({
    /**
     * Creates a successful Result object.
     * @template T The type of the value.
     * @param value The value to be wrapped in the successful Result.
     * @returns A ResultSuccess object.
     */
    success: <T>(value: T): ResultSuccess<T> => ({ success: true, value }),

    /**
     * Creates a failed Result object.
     * @template O The type of the object or context associated with the issues.
     * @param issues An array of Issue objects describing the failure.
     * @returns A ResultFailure object.
     */
    failure: <O>(issues: Issue<O>[]): ResultFailure<O> => ({ success: false, issues })
});

/**
 * Represents an error that contains a collection of issues.
 * @template O The type of the object or context associated with the issues.
 */
export class ResultError<O> extends Error {
    #issues: Issue<O>[];

    /**
     * Creates a new ResultError instance.
     * @param message The error message.
     * @param issues An array of Issue objects associated with this error.
     */
    constructor(message: string, issues: Issue<O>[]) {
        super(message);
        this.#issues = issues;
    }

    /**
     * Gets the array of issues associated with this error.
     */
    get issues() { return this.#issues; }
}