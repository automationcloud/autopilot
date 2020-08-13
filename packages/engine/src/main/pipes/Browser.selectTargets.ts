import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import { Page } from '@automationcloud/cdp';

import URL from 'url';

export class SelectTargets extends Pipe {
    static $type = 'Browser.selectTargets';
    static $help = `
Returns information about all currently open browser targets (tabs, popups, windows, iframes),
matching specified criteria.
`;

    @params.Enum({ enum: ['page', 'iframe'] })
    targetType: string = 'page';

    @params.String()
    hostnameRegexp: string = '.*';

    @params.String()
    pathnameRegexp: string = '.*';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const pages = await this.collectPages();
        const results = [];
        for (const el of inputSet) {
            for (const page of pages) {
                const document = await page.document();
                results.push(new Element(document, el.value));
            }
        }
        return results;
    }

    async collectPages(): Promise<Page[]> {
        const targetType = this.targetType;
        const hostnameRegexp = this.hostnameRegexp;
        const pathnameRegexp = this.pathnameRegexp;
        const pages = [];
        const targets = [...this.$browser.connection.sessions.values()];
        for (const target of targets) {
            const { url, type } = target;
            if (type !== targetType || !target.isValidTarget()) {
                continue;
            }
            const { hostname, pathname } = URL.parse(url);
            if (!new RegExp(`^${hostnameRegexp}$`).test(hostname || '')) {
                continue;
            }
            if (!new RegExp(`^${pathnameRegexp}$`).test(pathname || '')) {
                continue;
            }
            const page = await target.getPage();
            pages.push(page);
        }
        return pages;
    }
}
