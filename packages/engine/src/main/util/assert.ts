import { createError } from './error';

/**
 * Asserts `condition` and throws a non-retriable error with code `InvalidScript`.
 * Useful for asserting script configuration issues (e.g. empty mandatory parameter).
 *
 * @param condition If falsy, assertion error is thrown.
 * @param message User-friendly message stating the problem.
 * @param details Optional JSON details.
 * @public
 */
export function assertScript(condition: any, message: string, details?: any): void {
    if (!condition) {
        throw scriptError(message, details);
    }
}

/**
 * Creates a non-retriable error with code `InvalidScript`.
 * Useful for asserting script configuration issues (e.g. empty mandatory parameter).
 *
 * @param message User-friendly message stating the problem.
 * @param details Optional JSON details.
 * @public
 */
export function scriptError(message: string, details?: any): Error {
    return createError({
        code: 'InvalidScript',
        message,
        details,
        retry: false,
    });
}

/**
 * Asserts `condition` and throws a retriable error with code `PlaybackError`.
 * Useful for asserting generic runtime issues.
 *
 * @param condition If falsy, assertion error is thrown.
 * @param message User-friendly message stating the problem.
 * @param details Optional JSON details.
 * @public
 */
export function assertPlayback(condition: any, message: string, details?: any): void {
    if (!condition) {
        throw playbackError(message, details);
    }
}

/**
 * Creates a retriable error with code `PlaybackError`.
 * Useful for asserting generic runtime issues.
 *
 * @param condition If falsy, assertion error is thrown.
 * @param message User-friendly message stating the problem.
 * @param details Optional JSON details.
 * @public
 */
export function playbackError(message: string, details?: any): Error {
    return createError({
        code: 'PlaybackError',
        message,
        details,
        retry: true,
    });
}
