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

import { Exception } from './exception';
import { ExecutionContext } from './execution-context';
import { Frame } from './frame';
import { RemoteObject } from './remote-object';
import { BoxModel, CdpNode, CdpQuad, CdpRemoteObject, Point, Quad } from './types';
import * as util from './util';

/**
 * Represents a remote reference to DOM node.
 *
 * @public
 */
export class RemoteElement extends RemoteObject {
    objectId: string;
    description: string;

    constructor(executionContext: ExecutionContext, cdpRemoteObject: CdpRemoteObject) {
        super(executionContext, cdpRemoteObject);
        this.objectId = cdpRemoteObject.objectId!;
        this.description = (cdpRemoteObject.description || '').toLowerCase();
    }

    isDocument() {
        return this.description.startsWith('#document');
    }

    isOption() {
        return this.description.startsWith('option');
    }

    isFrame() {
        return this.description.startsWith('frame') || this.description.startsWith('iframe');
    }

    async querySelectorAll(selector: string): Promise<RemoteElement[]> {
        return await this.executionContext.evaluateElementList(
            (el, sel) => {
                return el.querySelectorAll(sel);
            },
            this,
            selector,
        );
    }

    async querySelector(selector: string): Promise<RemoteElement | null> {
        return await this.executionContext.evaluateElement(
            (el, sel) => {
                return el.querySelector(sel);
            },
            this,
            selector,
        );
    }

    async queryXPathAll(expression: string): Promise<RemoteElement[]> {
        return await this.executionContext.evaluateElementList(
            (el, expr) => {
                const document = el.ownerDocument || window.document;
                const xpathResult = document.evaluate(expr, el, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                const eList = [];

                while (true) {
                    const element = xpathResult.iterateNext();
                    if (element == null) {
                        break;
                    }

                    if (element instanceof HTMLElement) {
                        eList.push(element);
                    }
                }

                return eList;
            },
            this,
            expression,
        );
    }

    async queryXPathOne(expression: string): Promise<RemoteElement | null> {
        return await this.executionContext.evaluateElement(
            (el, expr) => {
                const document = el.ownerDocument || window.document;
                const xpathResult = document.evaluate(expr, el, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                const element = xpathResult.iterateNext();
                if (!(element instanceof HTMLElement)) {
                    return null;
                }

                return element;
            },
            this,
            expression,
        );
    }

    async matches(selector: string): Promise<boolean> {
        return await this.executionContext.evaluateJson(
            (el, sel) => {
                return el.matches(sel);
            },
            this,
            selector,
        );
    }

    async parent(): Promise<RemoteElement | null> {
        return this.executionContext.evaluateElement(el => {
            return el.parentElement;
        }, this);
    }

    async closest(selector: string): Promise<RemoteElement | null> {
        return await this.executionContext.evaluateElement(
            (el, sel) => {
                return el.closest(sel);
            },
            this,
            selector,
        );
    }

    async children(): Promise<RemoteElement[]> {
        return await this.executionContext.evaluateElementList(el => {
            return el.children;
        }, this);
    }

    async previousSibling(): Promise<RemoteElement | null> {
        return this.executionContext.evaluateElement(el => {
            return el.previousElementSibling;
        }, this);
    }

    async nextSibling(): Promise<RemoteElement | null> {
        return this.executionContext.evaluateElement(el => {
            return el.nextElementSibling;
        }, this);
    }

    async contains(otherEl: RemoteElement): Promise<boolean> {
        return this.executionContext.evaluateJson(
            (el, otherEl) => {
                return el.contains(otherEl);
            },
            this,
            otherEl,
        );
    }

    async isEqualTo(otherEl: RemoteElement): Promise<boolean> {
        return this.executionContext.evaluateJson(
            (el, otherEl) => {
                return el === otherEl;
            },
            this,
            otherEl,
        );
    }

    async click(options: ClickOptions = {}): Promise<void> {
        const {
            waitForStable = true,
            hideOverlays = true,
            ctrlKey = false,
            altKey = false,
            metaKey = false,
            shiftKey = false,
            button = 'left',
            clickCount = 1,
            delay = 0,
        } = options;
        const modifiers = this.page.inputManager.getModifiers({ altKey, ctrlKey, metaKey, shiftKey });
        if (this.isOption()) {
            return await this.selectOption();
        }
        const point = waitForStable ? await this.getStablePoint() : await this.getClickablePoint();
        if (hideOverlays) {
            await this.stashOverlays();
        }
        await this.page.inputManager.mouseMove(point, { modifiers });
        if (button !== 'none') {
            await this.page.inputManager.click(point, {
                modifiers,
                button,
                clickCount,
                delay,
            });
        }
        if (hideOverlays) {
            // Ignore errors if element already unloaded (e.g. navigation after click)
            this.unstashAll().catch(() => {});
        }
    }

    async typeText(text: string, options: TypeTextOptions = {}): Promise<void> {
        const {
            click = true,
            clickOptions = {},
            focus = true,
            clear = true,
            enter = false,
            blur = true,
            parallel = true,
            delay = 0,
        } = options;
        if (click) {
            await this.click(clickOptions);
        } else if (focus) {
            await this.focus();
        }
        if (clear) {
            await this.selectText();
            await this.page.inputManager.print('\b');
        }
        await this.page.inputManager.print(text, {
            delay,
            parallel,
        });
        if (enter) {
            await this.page.inputManager.print('\n');
        }
        if (blur) {
            await this.blur();
        }
    }

    async hover(options: ClickOptions = {}): Promise<void> {
        const { waitForStable = true, ctrlKey = false, altKey = false, metaKey = false, shiftKey = false } = options;
        const modifiers = this.page.inputManager.getModifiers({ altKey, ctrlKey, metaKey, shiftKey });
        if (this.isOption()) {
            const selectEl = await this.getClickTarget();
            return selectEl.hover(options);
        }
        const point = waitForStable ? await this.getStablePoint() : await this.getClickablePoint();
        await this.page.inputManager.mouseMove(point, { modifiers });
    }

    async selectOption(): Promise<void> {
        const err = await this.executionContext.evaluateJson(optionEl => {
            if (optionEl.nodeName !== 'OPTION') {
                return { code: 'DomManipulationError', message: 'Element is not an <option>' };
            }
            const selectEl = optionEl.closest('select');
            if (!selectEl) {
                return { code: 'DomManipulationError', message: 'Cannot find <select> for given <option>' };
            }
            const options = Array.from(selectEl.options);
            const index = options.indexOf(optionEl);
            if (selectEl.selectedIndex !== index) {
                selectEl.selectedIndex = index;
                const config = {
                    bubbles: true,
                    cancelable: false,
                    view: window,
                };
                selectEl.dispatchEvent(new Event('input', config));
                selectEl.dispatchEvent(new Event('change', config));
            }
        }, this);
        if (err) {
            throw new Exception({
                name: err.code,
                message: err.message,
                retry: true,
            });
        }
    }

    async describeNode(): Promise<CdpNode> {
        const { objectId } = this;
        const { node } = await this.page.send('DOM.describeNode', { objectId });
        return node;
    }

    async isConnected(): Promise<boolean> {
        return await this.executionContext.evaluateJson(el => {
            return el.isConnected;
        }, this);
    }

    async checkConnected() {
        const isConnected = await this.isConnected();
        if (!isConnected) {
            throw new Exception({
                name: 'ElementNotConnected',
                message: 'Element is not connected to DOM',
                retry: true,
            });
        }
    }

    async scrollIntoViewIfNeeded(): Promise<void> {
        // await this.checkConnected();
        await this.executionContext.evaluateJson(el => {
            const targetEl = el.nodeName === 'OPTION' ? el.closest('select') : el;
            targetEl.scrollIntoViewIfNeeded(true);
        }, this);
    }

    async scrollIntoView(): Promise<void> {
        // await this.checkConnected();
        await this.executionContext.evaluateJson(el => {
            const targetEl = el.nodeName === 'OPTION' ? el.closest('select') : el;
            targetEl.scrollIntoView({ block: 'center', inline: 'center' });
        }, this);
    }

    async getInfo(): Promise<RemoteElementInfo> {
        return await this.evaluateJson((el, toolkitBinding) => {
            return (window as any)[toolkitBinding].getElementInfo(el);
        }, this.page.toolkitBinding);
    }

    async isVisible(): Promise<boolean> {
        const quads = await this.getContentQuads();
        if (quads.length === 0) {
            return false;
        }
        const visibility = await this.evaluateJson(el => {
            return window.getComputedStyle(el).visibility;
        });
        return visibility !== 'hidden';
    }

    async checkVisible(): Promise<void> {
        const visible = await this.isVisible();
        if (!visible) {
            throw new Exception({
                name: 'ElementNotVisible',
                message: 'Element is not visible',
                retry: true,
            });
        }
    }

    async getStablePoint(): Promise<Point> {
        const timeout = this.page.browser.config.stableBoxTimeout;
        const timeoutAt = Date.now() + timeout;
        let lastPoint = await this.getClickablePoint();
        while (Date.now() < timeoutAt) {
            await this.page.waitForAnimationFrame();
            const newPoint = await this.getClickablePoint();
            if (util.arePointsEqual(lastPoint, newPoint)) {
                return newPoint;
            }
            lastPoint = newPoint;
        }
        throw new Exception({
            name: 'ElementNotStable',
            message: 'Cannot obtain a stable element box (does it scroll randomly?)',
            retry: true,
        });
    }

    async getClickablePoint(forceScroll: boolean = false): Promise<Point> {
        if (this.isOption()) {
            const selectEl = await this.getClickTarget();
            return selectEl.getClickablePoint();
        }
        if (forceScroll) {
            await this.scrollIntoView();
        } else {
            await this.scrollIntoViewIfNeeded();
        }
        const quads = await this.getContentQuads();
        if (!quads.length) {
            throw new Exception({
                name: 'ElementNotVisible',
                message: 'Element is not visible',
                retry: true,
            });
        }
        // Find the quad currently visible on screen
        // Note: quads and viewport dimensions are unaffected by zoom,
        // (e.g. if you experiment with different zoom settings, you'll get exactly the same
        // metrics (widths, heights) from both getContentQuads and getLayoutMetrics);
        // but inputManager expects coordinates to be multiplied by zoom factor.
        const {
            visualViewport: { clientWidth, clientHeight, zoom = 1 },
        } = await this.page.getLayoutMetrics();
        const visibleQuad = util.findVisibleQuad(quads, clientWidth / zoom, clientHeight / zoom);
        if (visibleQuad) {
            const { x, y } = util.quadCenterPoint(visibleQuad);
            return { x, y, zoom };
        } else if (!forceScroll) {
            // Retry with forcing the scroll
            return await this.getClickablePoint(true);
        }
        // No point after all
        throw new Exception({
            name: 'ElementNotVisible',
            message: 'Could not find a clickable point in viewport',
            retry: true,
        });
    }

    async getContentQuads(): Promise<Quad[]> {
        const { objectId } = this;
        const res = await this.page.send('DOM.getContentQuads', { objectId }).catch(() => {
            // If element is not visible, the command will fail with
            // "Could not compute content quads."
            return { quads: [] };
        });
        let quads = res.quads.map((cdpQuad: CdpQuad) => util.fromCdpQuad(cdpQuad));
        if (quads.length === 0) {
            // Fallback to using client rects
            const rects = await this.getClientRects();
            quads = rects.map(rect => util.rectToQuad(rect));
        }
        return quads.filter((quad: Quad) => util.computeQuadArea(quad) > 1);
    }

    async getClientRects(): Promise<DOMRect[]> {
        return await this.evaluateJson(el => {
            const rects = [].slice.call(el.getClientRects());
            return rects.map((rect: DOMRect) => {
                const { x, y, left, right, top, bottom, width, height } = rect;
                return { x, y, left, right, top, bottom, width, height };
            });
        });
    }

    async getBoundingClientRect(): Promise<DOMRect> {
        return await this.evaluateJson(el => {
            const { x, y, left, right, top, bottom, width, height } = el.getBoundingClientRect();
            return { x, y, left, right, top, bottom, width, height };
        });
    }

    async getBoxModel(): Promise<BoxModel> {
        const { objectId } = this;
        const { model } = await this.page.send('DOM.getBoxModel', { objectId });
        return {
            content: util.fromCdpQuad(model.content),
            padding: util.fromCdpQuad(model.padding),
            border: util.fromCdpQuad(model.border),
            margin: util.fromCdpQuad(model.margin),
            width: model.width,
            height: model.height,
        };
    }

    async stashOverlays(): Promise<void> {
        await this.evaluate((el, toolkitBinding) => {
            (window as any)[toolkitBinding].stashObscuringElements(el);
        }, this.page.toolkitBinding);
    }

    async unstashAll(): Promise<void> {
        await this.evaluate((el, toolkitBinding) => {
            (window as any)[toolkitBinding].unstashAll();
        }, this.page.toolkitBinding);
    }

    async selectText() {
        await this.executionContext.evaluate(el => el.select(), this);
    }

    async focus() {
        await this.executionContext.evaluate(el => el.focus(), this);
    }

    async blur() {
        await this.executionContext.evaluate(el => el.blur(), this);
    }

    async getClickTarget(): Promise<RemoteElement> {
        if (this.isOption()) {
            const selectEl = await this.closest('select');
            if (!selectEl) {
                throw new Exception({
                    name: 'DomManipulationError',
                    message: 'Cannot find <select> for given <option>',
                    retry: true,
                });
            }
            return selectEl;
        }
        return this;
    }

    async resolveFrame(): Promise<Frame | null> {
        const { nodeName, frameId } = await this.describeNode();
        if (!frameId) {
            throw new Exception({
                name: 'FrameAccessFailed',
                message: `Cannot access contentDocument of ${nodeName} (reason: frameId not found on Node)`,
                retry: true,
            });
        }
        return await this.page.resolveFrameById(frameId);
    }

    async contentDocument(): Promise<RemoteElement> {
        const frame = await this.resolveFrame();
        if (!frame) {
            throw new Exception({
                name: 'FrameAccessFailed',
                message: 'Cannot access iframe document (reason: frame not found by frameId)',
                retry: true,
            });
        }
        return await frame.document();
    }

    async ownerDocument(): Promise<RemoteElement> {
        const doc = await this.evaluateElement(el => (el instanceof Document ? el : el.ownerDocument));
        if (!doc) {
            throw new Exception({
                name: 'DomManipulationError',
                message: `Cannot obtain owner document of ${this.description}`,
                retry: true,
            });
        }
        return doc;
    }

    async shadowRoot(): Promise<RemoteElement> {
        const el = await this.evaluateElement(el => el.shadowRoot);
        if (!el) {
            throw new Exception({
                name: 'DomManipulationError',
                message: `Cannot obtain shadow root of ${this.description}`,
                retry: true,
            });
        }
        return el;
    }

    async createSelector(scopeEl: RemoteElement, unique: boolean = false): Promise<string> {
        return await this.executionContext.evaluateJson(
            (scopeEl, el, unique, toolkitBinding) => {
                return (window as any)[toolkitBinding].createSelector(scopeEl, el, unique);
            },
            scopeEl,
            this,
            unique,
            this.page.toolkitBinding,
        );
    }

    async sendPost(url: string, postParams: Array<[string, string]>) {
        await this.executionContext.evaluateJson(
            (url, postParams, toolkitBinding) => {
                (window as any)[toolkitBinding].sendPost(url, postParams);
            },
            url,
            postParams,
            this.page.toolkitBinding,
        );
    }

    highlight() {
        this.page.domManager.highlightElement(this);
    }

    hideHighlight() {
        this.page.domManager.hideHighlight();
    }
}

export interface RemoteElementInfo {
    nodeType: number;
    nodeName: string;
    tagName: string;
    isConnected: boolean;
    attributes: { [name: string]: string };
    classList: string[];
    text: string;
    innerText: string;
    textContent: string;
    childText: string;
    value: string;
    checked?: boolean;
    selected?: boolean;
    disabled?: boolean;
    indeterminate?: boolean;
}

export interface ClickOptions {
    waitForStable?: boolean;
    hideOverlays?: boolean;
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    button?: 'left' | 'right' | 'middle' | 'none';
    clickCount?: number;
    delay?: number;
}

export interface TypeTextOptions {
    click?: boolean;
    clickOptions?: ClickOptions;
    focus?: boolean;
    clear?: boolean;
    enter?: boolean;
    blur?: boolean;
    parallel?: boolean;
    delay?: number;
}
