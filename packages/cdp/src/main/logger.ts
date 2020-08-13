export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'mute';

export const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error', 'mute'];

export abstract class Logger {
    abstract info(message: string, object?: any): void;
    abstract warn(message: string, object?: any): void;
    abstract error(message: string, object?: any): void;
    abstract debug(message: string, object?: any): void;
    abstract child(context: any): Logger;
}

export abstract class LoggerBase extends Logger {
    contextData: object = {};
    level: LogLevel = 'info';

    protected abstract write(level: LogLevel, message: string, details: object): void;

    log(level: LogLevel, message: string, details: object) {
        if (level === 'mute' || LOG_LEVELS.indexOf(level) < LOG_LEVELS.indexOf(this.level)) {
            return;
        }
        this.write(level, message, details);
    }

    info(message: string, details: object = {}) {
        this.log('info', message, details);
    }

    warn(message: string, details: object = {}) {
        this.log('warn', message, details);
    }

    error(message: string, details: object = {}) {
        this.log('error', message, details);
    }

    debug(message: string, details: object = {}) {
        this.log('debug', message, details);
    }

}

export class ConsoleLogger extends LoggerBase {

    constructor() {
        super();
        const level = (process.env.LOG_LEVEL || 'info') as LogLevel;
        this.level = LOG_LEVELS.includes(level) ? level : 'info';
    }

    protected write(level: LogLevel, message: string, details: object) {
        if (level === 'mute') {
            return;
        }
        // eslint-disable-next-line no-console
        return console[level](message, details);
    }

    child(data: object) {
        const child = new ConsoleLogger();
        child.level = this.level;
        child.contextData = { ...this.contextData, ...data };
        return child;
    }

}
