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

import * as util from './util';
import { RemoteElement, RemoteElementInfo, RemoteObject, Exception } from '@automationcloud/cdp';

/**
 * Represents a data unit in Automation Engine.
 *
 * Each element can be seen as a tuple of DOM node and associated JSON `value`.
 *
 * Actions and Pipes obtain and manipulate elements by means of:
 *
 * - scope inheritance (child actions receive elements produced by their parents,
 *   see {@link Action.resolveScope})
 * - executing {@link Pipeline} (in either acitons or pipes) allowing users to build
 *   their own data manipulation pipelines
 * - cloning existing element with a different JSON value
 * - constructing them directly from {@link RemoteElement} and arbitrary JSON value
 *
 * @public
 */
export class Element {
    /**
     * CDP mirror object representing DOM node.
     * @public
     */
    remote: RemoteElement;

    /**
     * JSON-serializable value of this element.
     * @public
     */
    value: any;

    /**
     * DOM node info cache.
     *
     * @internal
     */
    info?: RemoteElementInfo;

    /**
     * Constructs a new Element instance.
     * @param remote {@link RemoteElement}
     * @param value Arbitrary JSON value
     * @param info
     */
    constructor(remote: RemoteElement, value: any, info?: RemoteElementInfo) {
        this.remote = remote;
        this.value = value;
        this.info = info;
    }

    /**
     * CDP remote object id.
     * @internal
     */
    get objectId() {
        return this.remote.objectId;
    }

    /**
     * String description of DOM node provided by CDP.
     * @internal
     */
    get description() {
        return this.remote.description;
    }

    /**
     * Reference to {@link Page} this element was obtained from.
     * @public
     */
    get page() {
        return this.remote.page;
    }

    /**
     * CDP {@link ExecutionContext} this element belongs to.
     */
    get executionContext() {
        return this.remote.executionContext;
    }

    /**
     * Creates a copy of this Element, referencing the same DOM node but
     * with different JSON value.
     * The `newValue` is deeply copied, so modifying the `newElement.value` will not affect
     * the original `newValue`.
     *
     * @param newValue
     */
    clone(newValue: any = this.value) {
        const val = util.deepClone(newValue);
        return new Element(this.remote, val, this.info);
    }

    /**
     * Returns DOM node info, either from cache or obtained from the page.
     *
     * @param force If `true`, the cached value will be ignored.
     * @public
     */
    async getInfo(force: boolean = false): Promise<RemoteElementInfo> {
        if (force || !this.info) {
            this.info = await this.remote.getInfo();
        }
        return this.info;
    }

    /**
     * Evaluates `pageFn` in the same execution context as this object.
     * The remote object is passed as `pageFn`'s first argument.
     * The value returned from `pageFn` must be JSON-serializable.
     *
     * @param pageFn Function to execute in page context.
     * @param args Array of additional arguments that will be available in `pageFn`.
     * @public
     */
    async evaluateJson<T>(pageFn: (el: any, ...args: any[]) => T | Promise<T>, ...args: any[]): Promise<T> {
        return await this.executionContext.evaluateJson(pageFn, this.remote, ...args);
    }

    /**
     *
     * @param selector
     * @param optional
     * @public
     */
    async queryAll(selector: string, optional: boolean = false): Promise<Element[]> {
        const obj = await this.executionContext.evaluate(
            (root, sel, toolkitBinding) => {
                const nodeList = root.querySelectorAll(sel);
                const infos = [];
                for (const newEl of nodeList) {
                    infos.push((window as any)[toolkitBinding].getElementInfo(newEl));
                }
                return {
                    nodeList,
                    infos,
                };
            },
            this.remote,
            selector,
            this.page.toolkitBinding,
        );
        const newEls = await this.extractElementsWithInfo(obj);
        if (newEls.length === 0 && !optional) {
            throw new Exception({
                name: 'SelectorNotFound',
                message: 'No elements found by selector. Use optional: true to return 0 elements.',
                retry: true,
                details: { selector, optional },
            });
        }
        return newEls;
    }

    /**
     *
     * @param selector
     * @param optional
     * @public
     */
    async queryOne(selector: string, optional: boolean = false): Promise<Element | null> {
        const newEls = await this.queryAll(selector, optional);
        if (newEls.length > 1) {
            throw new Exception({
                name: 'SelectorAmbiguous',
                message: 'Multiple elements found by selector. Use queryAll to return multiple elements.',
                retry: true,
                details: { selector, optional },
            });
        }
        return newEls[0];
    }

    /**
     *
     * @param expression
     * @param optional
     * @public
     */
    async queryXPathAll(expression: string, optional: boolean = false): Promise<Element[]> {
        const remotes = await this.remote.queryXPathAll(expression);
        const newEls = remotes.map(r => new Element(r, this.value));

        if (newEls.length === 0 && !optional) {
            throw new Exception({
                name: 'XpathNotFound',
                message: 'No elements found by Xpath expression. Use optional: true to return 0 elements.',
                retry: true,
                details: { expression, optional },
            });
        }
        return newEls;
    }

    /**
     *
     * @param expression
     * @param optional
     * @public
     */
    async queryXPathOne(expression: string, optional: boolean = false): Promise<Element | null> {
        const newEls = await this.queryXPathAll(expression, optional);
        if (newEls.length > 1) {
            throw new Exception({
                name: 'XpathAmbiguous',
                message: 'Multiple elements found by Xpath expression. Use queryXpathAll to return multiple elements.',
                retry: true,
                details: { expression, optional },
            });
        }
        return newEls[0];
    }

    /**
     * @param optional
     * @public
     */
    async parent(optional: boolean): Promise<Element | null> {
        const newRemote = await this.remote.parent();
        util.assertPlayback(newRemote || optional, 'Parent element not found');
        return newRemote ? new Element(newRemote, this.value) : null;
    }

    /**
     * @param optional
     * @public
     */
    async children(optional: boolean = false): Promise<Element[]> {
        const obj = await this.executionContext.evaluate(
            (root, toolkitBinding) => {
                const nodeList = root.children;
                const infos = [];
                for (const newEl of nodeList) {
                    infos.push((window as any)[toolkitBinding].getElementInfo(newEl));
                }
                return {
                    nodeList,
                    infos,
                };
            },
            this.remote,
            this.page.toolkitBinding,
        );
        const newEls = await this.extractElementsWithInfo(obj);
        util.assertPlayback(
            newEls.length > 0 || optional,
            'No child elements found. Use optional: true to return 0 elements.',
        );
        return newEls;
    }

    /**
     * @param optional
     * @public
     */
    async previousSibling(optional: boolean): Promise<Element | null> {
        const newRemote = await this.remote.previousSibling();
        util.assertPlayback(newRemote || optional, 'Previous sibling element not found');
        return newRemote ? new Element(newRemote, this.value) : null;
    }

    /**
     * @param optional
     * @public
     */
    async nextSibling(optional: boolean): Promise<Element | null> {
        const newRemote = await this.remote.nextSibling();
        util.assertPlayback(newRemote || optional, 'Next sibling element not found');
        return newRemote ? new Element(newRemote, this.value) : null;
    }

    /**
     * @param selector
     * @param optional
     * @public
     */
    async closest(selector: string, optional: boolean = false): Promise<Element | null> {
        const newRemote = await this.remote.closest(selector);
        util.assertPlayback(newRemote || optional, 'No ancestor found by selector. Use optional: true to return null');
        return newRemote ? new Element(newRemote, this.value) : null;
    }

    /**
     * @public
     */
    async contentDocument(): Promise<Element> {
        const newRemote = await this.remote.contentDocument();
        return new Element(newRemote, this.value);
    }

    /**
     * @param message
     * @public
     */
    async assertElement(message: string): Promise<void> {
        const nodeType = await this.remote.evaluateJson(el => el.nodeType);
        if (nodeType !== 1) {
            throw new Exception({
                name: 'InvalidDomElement',
                message,
                retry: true,
            });
        }
    }

    /**
     * Extracts Element instances from a remote object { nodeList, infos } which holds
     * pre-calculated info for each Node. This greatly speeds up mass info extraction (i.e. > 1000 elements).
     *
     * @internal
     */
    async extractElementsWithInfo(obj: RemoteObject): Promise<Element[]> {
        const nodeList = await this.executionContext.evaluate(obj => obj.nodeList, obj);
        const infos = await this.executionContext.evaluateJson(obj => obj.infos, obj);
        const remoteEls = await this.executionContext.nodeListToElements(nodeList);
        const result = [];
        for (const [i, remoteEl] of remoteEls.entries()) {
            const info = infos[i] as RemoteElementInfo;
            result.push(new Element(remoteEl, this.value, info));
        }
        return result;
    }

    /**
     * @internal
     */
    async tooltip(label: string, color: string = 'hsla(144, 48%, 48%, .4)') {
        try {
            const target = this.remote.isOption() ? await this.remote.closest('select') : this.remote;
            const key = target!.objectId.replace(/[^a-z0-9]/gi, '');
            await this.executionContext.evaluate(
                (el, key, ttl, label, color, toolkitBinding) => {
                    (window as any)[toolkitBinding].showRect(el, {
                        key,
                        ttl,
                        label,
                        color,
                    });
                },
                target,
                key,
                1000,
                label,
                color,
                this.page.toolkitBinding,
            );
        } catch (e) {
            // Just ignore it
        }
    }
}
