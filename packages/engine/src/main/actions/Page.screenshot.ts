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

import { Action } from '../action';
import { params } from '../model';

export class ScreenshotAction extends Action {
    static $type = 'Page.screenshot';
    static $icon = 'fas fa-camera';
    static $help = `
Captures the screenshot and sends it to the Job.

### Parameters

- full page: emulate viewport to match content width and content height of current webpage,
  which generally results in full page screenshot
  (unless the page uses scrollable containers with fixed width or height)
- public: mark screenshots as public
- min width: minimum width for full page emulation
- max width: maximum width for full page emulation
- min height: minimum height for full page emulation
- max height: maximum height for full page emulation

### Use For

- taking debug screenshots
- sending public screenshots
`;

    @params.Boolean()
    fullPage: boolean = false;

    @params.Boolean()
    isPublic: boolean = true;

    @params.Number({ min: 0 })
    minWidth: number = 0;

    @params.Number({ min: 0 })
    maxWidth: number = 5000;

    @params.Number({ min: 0 })
    minHeight: number = 0;

    @params.Number({ min: 0 })
    maxHeight: number = 10000;

    @params.Boolean()
    scrollToTop: boolean = true;

    async exec() {
        if (this.scrollToTop) {
            await this.$page.evaluate(() => {
                window.scrollTo(0, 0);
            });
        }
        // TODO make level configurable per-action (?)
        await this.$reporter.sendScreenshot('info', {
            label: this.label,
            isPublic: this.isPublic,
            fullPage: this.fullPage,
            minHeight: this.minHeight,
            maxHeight: this.maxHeight,
            minWidth: this.minWidth,
            maxWidth: this.maxWidth,
        });
    }
}
