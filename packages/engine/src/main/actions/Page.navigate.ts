// Copyright 2020 Ubio Limited
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

import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

export class NavigateAction extends Action {
    static $type = 'Page.navigate';
    static $icon = 'fas fa-plane';
    static $help = `
Navigates to the URL, evaluated by pipeline.

The pipeline should produce a single element with string value, which is treated as URL to navigate to.

### Parameters

- reject netwrok errors: if checked, an error will be thrown if navigation results in network-level errors
  (i.e. domain name not resolved, connection failed, etc)
- reject http errors: if checked, an error will be thrown if navigation results in HTTP error
  (i.e. response status code is greater than or equal to 400)
- open new tab: if checked, opens new tab and performs navigation in it (the new tab also becomes active)
- close other tabs: if checked, closes all other tabs after navigating, useful in conjunction with "Open new tab"

### Use For

- performing initial navigation
- navigating to known URLs (e.g. checkout page)
`;

    @params.Pipeline()
    pipeline!: Pipeline;
    @params.Boolean()
    rejectHttpErrors: boolean = true;
    @params.Boolean()
    rejectNetworkErrors: boolean = true;
    @params.Boolean()
    openNewTab: boolean = false;
    @params.Boolean()
    closeOtherTabs: boolean = false;
    @params.Number()
    timeout: number = 30000;

    async exec() {
        await this.retry(async () => {
            const el = await this.selectSingle(this.pipeline, false);
            util.checkType(el!.value, 'string');
            if (this.openNewTab) {
                await this.$browser.openNewTab();
                if (this.closeOtherTabs) {
                    await this.$browser.closeOtherTabs();
                }
            }
            await this.$page.navigate(el!.value, {
                timeout: this.timeout,
                rejectHttpErrors: this.rejectHttpErrors,
                rejectNetworkErrors: this.rejectNetworkErrors,
            });
        });
    }
}
