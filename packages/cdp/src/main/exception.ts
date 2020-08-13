export interface ExceptionSpec {
    name: string;
    code?: string;
    message?: string;
    retry?: boolean;
    details?: object;
}

/**
 * Represents an error thrown with a specific error code.
 *
 * Additionally, `retry` can be specified to indicate that the error occurs in
 * intermediate application state (e.g. when page unloads/loads) and can be retried.
 *
 * @public
 */
export class Exception extends Error {
    code: string;
    retry?: boolean;
    details?: any;

    constructor(spec: ExceptionSpec) {
        super(spec.message);
        this.name = spec.name;
        this.code = spec.code || spec.name;
        this.message = spec.message || spec.name;
        if (spec.retry != null) {
            this.retry = spec.retry;
        }
        this.details = spec.details;
    }

}
