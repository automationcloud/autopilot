import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import { RemoteElementInfo } from '@automationcloud/cdp';

export abstract class DomExtractPipe extends Pipe {
    abstract getDatum(info: RemoteElementInfo): any;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return await this.map(inputSet, async el => {
            const info = await el.getInfo();
            const datum = this.getDatum(info);
            return el.clone(datum);
        });
    }
}
