import { injectable } from 'inversify';
import { ReporterService } from '@automationcloud/engine';

@injectable()
export class AutopilotReporterService extends ReporterService {
    async sendScreenshot() {}
    async sendHtmlSnapshot() {}
    async sendEvent() {}
}
