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

import { Page } from './page';
import { RemoteElement } from './remote-element';

const SCREENSHOT_TIMEOUT = 500;

// TODO move to Engine
export class ScreenshotManager {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async captureViewport(options: ScreenshotOptions = {}) {
        const { format = 'jpeg', quality = 50 } = options;
        const { visualViewport } = await this.page.getLayoutMetrics();
        const { data } = await this.page.send('Page.captureScreenshot', { format, quality }, SCREENSHOT_TIMEOUT);
        const { clientWidth, clientHeight } = visualViewport;
        return {
            width: clientWidth,
            height: clientHeight,
            imageData: data,
        };
    }

    async captureElement(el: RemoteElement, options: ScreenshotOptions = {}): Promise<Screenshot> {
        const { format = 'jpeg', quality = 75, scrollIntoView = true } = options;
        if (scrollIntoView) {
            await el.scrollIntoView();
            await new Promise(r => setTimeout(r, 200));
        }
        const box = await el.getBoxModel();

        const width = Math.min(Math.floor(box.width), 10000);
        const height = Math.min(Math.floor(box.height), 10000);
        await this.page.activate();

        const { visualViewport } = await this.page.getLayoutMetrics();
        const { data } = await this.page.send('Page.captureScreenshot', {
            format,
            quality,
            clip: {
                x: Math.floor(box.border[0].x + visualViewport.pageX),
                y: Math.floor(box.border[0].y + visualViewport.pageY),
                width,
                height,
                scale: 1,
            },
        }, SCREENSHOT_TIMEOUT);
        return {
            width,
            height,
            imageData: data,
        };
    }

    async captureFullPage(options: ScreenshotOptions = {}) {
        const {
            minWidth = 0,
            maxWidth = 10000,
            minHeight = 1200,
            maxHeight = 1000,
            format = 'jpeg',
            quality = 50,
        } = options;
        const { contentSize } = await this.page.getLayoutMetrics();
        const width = clamp(contentSize.width, minWidth, maxWidth);
        const height = clamp(contentSize.height, minHeight, maxHeight);
        await this.page.send('Emulation.setDeviceMetricsOverride', {
            mobile: false,
            deviceScaleFactor: 1,
            positionX: 0,
            positionY: 0,
            width,
            height,
        });
        const { data } = await this.page.send('Page.captureScreenshot', { format, quality }, SCREENSHOT_TIMEOUT);
        this.page.browser.emit('emulationInvalid');
        return {
            width,
            height,
            imageData: data,
        };
    }
}

export interface Screenshot {
    width: number;
    height: number;
    imageData: string;
}

export interface ScreenshotOptions {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    format?: 'png' | 'jpeg';
    quality?: number;
    scrollIntoView?: boolean;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(Math.ceil(value), max), min);
}
