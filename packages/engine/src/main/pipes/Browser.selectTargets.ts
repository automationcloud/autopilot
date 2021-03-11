// Copyright 2020 UBIO Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Page } from '@automationcloud/cdp';
import URL from 'url';

import { RuntimeCtx } from '../ctx';
import { Element } from '../element';
import { params } from '../model';
import { Pipe } from '../pipe';

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
