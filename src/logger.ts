type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
    private readonly tag: string;

    constructor(tag: string) {
        this.tag = tag;
    }

    private log(level: LogLevel, ...args: unknown[]): void {
        if (!__DEV__) return;
        const prefix = `[${this.tag}]`;
        // eslint-disable-next-line no-console
        console[level](prefix, ...args);
    }

    debug(...args: unknown[]): void { this.log('debug', ...args); }
    info(...args: unknown[]): void { this.log('info', ...args); }
    warn(...args: unknown[]): void { this.log('warn', ...args); }
    error(...args: unknown[]): void { this.log('error', ...args); }
}

export const placesLogger = new Logger('places');
export const cacheLogger = new Logger('cache');
export const compassLogger = new Logger('compass');
