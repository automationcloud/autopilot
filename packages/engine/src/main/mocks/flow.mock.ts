import { injectable } from 'inversify';
import assert from 'assert';
import { FlowService } from '../services';
import { ScriptInput, ScriptOutput } from '../script';

@injectable()
export class FlowServiceMock extends FlowService {
    inputs: ScriptInput[] = [];
    outputs: ScriptOutput[] = [];

    async requestInputData(key: string) {
        const input = this.inputs.find(_ => _.key === key);
        assert(input, `Input ${key} not found`);
        return input!.data;
    }

    async peekInputData(key: string) {
        const input = this.inputs.find(_ => _.key === key);
        return input?.data || null;
    }

    async sendOutputData(key: string, data: any) {
        this.outputs.push({ key, data });
    }

    async sendScreenshot() { }
    async sendHtmlSnapshot() { }
    async sendEvent() { }
}
