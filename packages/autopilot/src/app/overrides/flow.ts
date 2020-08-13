import { FlowService, util } from '@automationcloud/engine';
import { injectable } from 'inversify';

@injectable()
export class AutopilotFlowService extends FlowService {
    get app() {
        // Note: whilst we don't have a fully IoCized Autopilot
        // this seems to be the only solution for passing the app instance here.
        // Otherwise we run into circular dependencies.
        return (global as any).app;
    }

    isInputsCached() {
        return false;
    }

    async requestInputData(key: string) {
        const data = this.app.datasets.getInputData(key, '');
        return util.deepClone(data);
    }

    async peekInputData(key: string) {
        const data = this.app.datasets.getInputData(key, '', false);
        return util.deepClone(data);
    }

    async sendOutputData(key: string, data: any) {
        const { draft } = this.app.project.metadata;
        const domain = this.app.tools.getDomain();
        if (!domain) {
            throw new Error('Cannot access protocol for validation');
        }
        const { valid } = await domain.validateOutput(key, data);
        if (!valid && !draft) {
            throw new Error('Output is not valid. Enable "draft" mode to bypass validation.');
        }
    }

    async setPnr() {}

    async unsetPnr() {}
}
