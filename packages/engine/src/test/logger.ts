import { ConsoleLogger, LogLevel } from '@automationcloud/cdp';

export const testLogger = new ConsoleLogger();
testLogger.level = (process.env.LOG_LEVEL || 'info') as LogLevel;
