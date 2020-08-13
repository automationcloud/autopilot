import { injectable } from 'inversify';

export type ReportingLevel = 'debug' | 'info' | 'error' | 'mute';

@injectable()
export class ReporterService {
    static LEVELS: ReportingLevel[] = ['debug', 'info', 'error', 'mute'];

    checkLevel(requested: ReportingLevel, desired: ReportingLevel) {
        return ReporterService.LEVELS.indexOf(requested) >= ReporterService.LEVELS.indexOf(desired);
    }

    async sendScreenshot(_level: ReportingLevel, _options?: ScreenshotSpec) {}
    async sendHtmlSnapshot(_level: ReportingLevel) {}
    async sendEvent(_level: ReportingLevel, _eventName: string, _eventData?: EventData) {}
}

export interface ScreenshotSpec {
    label?: string;
    isPublic?: boolean;
    fullPage?: boolean;
    minHeight?: number;
    maxHeight?: number;
    minWidth?: number;
    maxWidth?: number;
}

export interface EventData {
    details?: any;
    action?: any;
    context?: any;
}
