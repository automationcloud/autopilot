export interface ErrorSpec {
    message: string;
    code: string;
    retry: boolean;
    details?: any;
    scriptError?: boolean;
}

export class GenericError extends Error {
    code: string;
    retry: boolean;
    details: any;
    scriptError: boolean;

    constructor(spec: ErrorSpec) {
        super(spec.message);
        this.name = spec.code;
        this.code = spec.code;
        this.retry = spec.retry;
        this.details = spec.details || {};
        this.scriptError = spec.scriptError || false;
    }
}

export function createError(spec: ErrorSpec) {
    return new GenericError(spec);
}
