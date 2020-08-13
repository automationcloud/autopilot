/* eslint-disable no-console */
import { FlowService, Engine, BrowserService, Script } from '../main';
import { promises as fs } from 'fs';

process.env.LOG_LEVEL = 'mute';

const file = '/Users/inca/Desktop/Google News.ubscript';

const inputs: any = {
    query: 'Coronavirus'
};
const outputs: any = {};

class MyCustomFlow extends FlowService {

    async requestInputData(key: string) {
        return inputs[key];
    }

    async peekInputData(key: string) {
        return inputs[key];
    }

    async sendOutputData(key: string, data: any) {
        outputs[key] = data;
    }
}

async function main() {
    const engine = new Engine();
    engine.container.rebind(FlowService).to(MyCustomFlow);
    const browser = engine.get(BrowserService);
    await browser.connect();
    await browser.openNewTab();
    const scriptJson = JSON.parse(await fs.readFile(file, 'utf-8'));
    const script = await Script.load(engine, scriptJson.script);
    await script.runAll();
    console.log(outputs);
}

main();
