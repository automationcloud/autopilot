declare module 'ub-node-logger' {
    interface LoggerConfig {
        severity: string;
        mode: 'pretty' | 'production';
        service: string;
        version: string;
    }

    interface Logger {
        [severity: string]: (message: string, context?: any) => void;
    }

    function createLogger(config: LoggerConfig): Logger;

    export = createLogger;
}
