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

import { RemoteElementInfo } from '../remote-element';

export function toolkit(options: any = {}) {
    const binding: string = options.toolkitBinding || 'ubio';

    (window as any)[binding] = {
        getElementInfo,
        stashElement,
        stashObscuringElements,
        unstashAll,
        showRect,
        hideAllRects,
        createSelector,
        htmlSnapshot,
        sendPost,
    };

    const SEMANTIC_TAGS = [
        'input',
        'form',
        'button',
        'select',
        'a',
        'tr',
        'td',
        'table',
        'tbody',
        'thead',
        'article',
        'section',
        'aside',
        'figure',
        'caption',
    ];

    const OMITTED_TAGS = ['html', 'head', 'body', 'div', 'span'];

    const SNAPSHOT_FORBIDDEN_TAGS = ['SCRIPT', 'NOSCRIPT', 'SVG'];
    const SNAPSHOT_FORBIDDEN_ATTRS = [/^sandbox$/i, /^srcdoc$/i, /^on.*/i];

    const stashedElements: Array<[any, string]> = [];

    function getElementInfo(el: any): RemoteElementInfo {
        if (el.nodeType !== 1) {
            throw new Error(`Cannot extract element information from ${el.nodeName}`);
        }
        const normalize = (str: string) => (str || '').replace(/\s+/g, ' ').trim();
        let childText = '';
        for (const childNode of el.childNodes) {
            if (childNode.nodeType === 3) {
                childText += childNode.nodeValue;
            }
        }
        const { innerText, textContent, value } = el;
        const attributes: { [name: string]: string } = {};
        for (const attr of el.attributes) {
            attributes[attr.name] = attr.value;
        }
        const classList: string[] = [];
        for (const className of el.classList) {
            classList.push(className);
        }
        return {
            nodeType: el.nodeType,
            nodeName: el.nodeName,
            tagName: el.nodeName.toLowerCase(),
            isConnected: el.isConnected,
            attributes,
            classList,
            text: normalize(innerText || textContent || value || ''),
            innerText: normalize(innerText),
            textContent: normalize(textContent),
            childText: normalize(childText),
            value: normalize(el.value),
            checked: el.checked,
            selected: el.selected,
            disabled: el.disabled,
        };
    }

    function stashElement(el: any) {
        const exStyle = el.getAttribute('style') || '';
        el.setAttribute('style', 'display: none !important');
        stashedElements.push([el, exStyle]);
    }

    function unstashAll() {
        while (stashedElements.length > 0) {
            const [el, style] = stashedElements.pop()!;
            el.setAttribute('style', style);
        }
    }

    function stashObscuringElements(el: any) {
        let limit = 1000;
        while (limit > 0) {
            const rects = el.getClientRects();
            for (const rect of rects) {
                if (rect.width * rect.height <= 1) {
                    continue;
                }
                const centerX = rect.x + rect.width / 2;
                const centerY = rect.y + rect.height / 2;
                const overlay = document.elementFromPoint(centerX, centerY);
                if (!overlay || el.contains(overlay) || overlay.contains(el)) {
                    return;
                }
                stashElement(overlay);
            }
            limit -= 1;
        }
    }

    function showRect(el: HTMLElement, options: any = {}): void {
        const {
            color = 'hsla(204, 72%, 48%, .4)',
            shadow = '0 0 0 1px rgba(0,0,0,.2) inset',
            label = '',
            key,
            ttl,
        } = options;
        if (!(el instanceof HTMLElement) || !el.ownerDocument) {
            return;
        }
        const document = el.ownerDocument;
        const window = document.defaultView!;
        // Remove by unique key, if provided
        if (key) {
            const existingRects = document.querySelectorAll(`[data-ubio-rect="${key}"]`);
            for (const rect of existingRects) {
                rect.parentNode!.removeChild(rect);
            }
        }
        const box = el.getBoundingClientRect();
        const rect = document.createElement('div');
        document.documentElement!.appendChild(rect);
        rect.setAttribute('data-ubio', '');
        rect.setAttribute('data-ubio-rect', key || '_');
        rect.style.position = 'absolute';
        rect.style.zIndex = '999999999';
        rect.style.left = window.scrollX + box.left + 'px';
        rect.style.top = window.scrollY + box.top + 'px';
        rect.style.width = box.width + 'px';
        rect.style.height = box.height + 'px';
        rect.style.pointerEvents = 'none';
        rect.style.opacity = '0.75';
        rect.style.boxShadow = shadow;
        rect.style.background = color;

        if (label) {
            const lbl = document.createElement('span');
            rect.appendChild(lbl);
            lbl.innerText = label;
            lbl.style.position = 'absolute';
            lbl.style.top = '50%';
            lbl.style.left = '50%';
            lbl.style.background = 'rgba(0,0,0,.9)';
            lbl.style.color = '#fff';
            lbl.style.fontSize = '10px';
            lbl.style.padding = '2px 4px';
            lbl.style.borderRadius = '2px';
            lbl.style.transform = 'translate(-50%, -50%)';
        }

        if (ttl) {
            setTimeout(() => {
                if (document.contains(rect)) {
                    rect.parentNode!.removeChild(rect);
                }
            }, ttl);
        }
    }

    async function hideAllRects() {
        const rects = document.querySelectorAll('[data-ubio-rect]');
        for (const rect of rects) {
            rect.parentNode!.removeChild(rect);
        }
    }

    function createSelector(scopeEl: HTMLElement, el: HTMLElement, unique: boolean = false) {
        let sel = createSimpleSelector(scopeEl, el, unique);
        let rank = testSelector(scopeEl, sel);
        if (rank === 1) {
            return sel;
        }
        // Try adding ancestor selector and see if they can narrow down results
        for (const ancestor of getAncestors(scopeEl, el)) {
            // If ancestor already contains as many elements
            // as our best-so-far selector yields,
            // then we already reached their common ancestor
            // and refining selector further is not possible
            if (testSelector(ancestor, [':scope', sel].join(' ')) >= rank) {
                return sel;
            }
            let bestAncestorSel = null;
            let bestAncestorRank = rank;
            for (const ancestorSel of iterateSelectors(ancestor, unique)) {
                const candidateSel = [ancestorSel, sel].join(' ');
                const candidateRank = testSelector(scopeEl, candidateSel);
                if (candidateRank === 1) {
                    return candidateSel;
                }
                if (candidateRank < bestAncestorRank && candidateRank !== 0) {
                    bestAncestorRank = candidateRank;
                    bestAncestorSel = candidateSel;
                }
            }
            // Selector improved?
            if (bestAncestorRank < rank) {
                rank = bestAncestorRank;
                sel = bestAncestorSel!;
            }
        }
        return sel;
    }

    function createSimpleSelector(scopeEl: HTMLElement, el: HTMLElement, unique: boolean = false): string {
        let sel = '';
        let rank = +Infinity;
        for (const newSel of iterateSelectors(el, unique)) {
            const newRank = testSelector(scopeEl, newSel);
            if (newRank === 1) {
                return newSel;
            }
            if (newRank < rank && newRank !== 0) {
                rank = newRank;
                sel = newSel;
            }
        }
        return sel || el.nodeName.toLowerCase();
    }

    function testSelector(scopeEl: HTMLElement, selector: string): number {
        return scopeEl.querySelectorAll(selector).length;
    }

    function iterateSelectors(el: HTMLElement, useNthChild: boolean = false): IterableIterator<string> {
        return useNthChild ? _generateSelectorsWithNthChild(el) : _generateSelectors(el);
    }

    function* _generateSelectors(el: HTMLElement): IterableIterator<string> {
        const tagName = el.nodeName.toLowerCase();
        const prefix = SEMANTIC_TAGS.includes(tagName) ? tagName : '';
        const id = el.getAttribute('id') || '';
        const name = el.getAttribute('id') || '';
        if (id && !isJunkIdentifier(id)) {
            yield prefix + '#' + CSS.escape(id);
        }
        if (name) {
            yield prefix + `[name="${CSS.escape(name)}"]`;
        }
        for (const cl of el.classList) {
            yield prefix + '.' + CSS.escape(cl);
        }
        for (let i = 0; i < el.classList.length; i += 1) {
            for (let j = i + 1; j < el.classList.length; j += 1) {
                yield prefix + '.' + CSS.escape(el.classList[i]) + '.' + CSS.escape(el.classList[j]);
            }
        }
        if (!OMITTED_TAGS.includes(tagName)) {
            yield tagName;
        }
    }

    function* _generateSelectorsWithNthChild(el: HTMLElement): IterableIterator<string> {
        yield* _generateSelectors(el);
        if (!el.parentElement) {
            return;
        }
        const children: HTMLElement[] = [].slice.call(el.parentElement.children);
        const idx = children.indexOf(el);
        if (idx === -1) {
            return;
        }
        const nthChildSuffix = `:nth-child(${idx + 1})`;
        for (const sel of _generateSelectors(el)) {
            yield sel + nthChildSuffix;
        }
    }

    function* getAncestors(scopeEl: HTMLElement, el: HTMLElement): IterableIterator<HTMLElement> {
        let parent = el.parentElement;
        while (parent && scopeEl !== parent) {
            yield parent;
            parent = parent.parentElement;
        }
    }

    function isJunkIdentifier(str: string): boolean {
        return /\d{4,}/.test(str);
    }

    function htmlSnapshot(element: HTMLElement = window.document.documentElement!) {
        const document = element.ownerDocument!;
        const clone = cloneNode(element) as HTMLElement;
        return clone ? clone.outerHTML : '';

        function cloneNode(node: Node) {
            switch (node.nodeType) {
                case 1: {
                    const el = node as HTMLElement;
                    const nodeName = el.nodeName.toUpperCase();
                    // Drop restricted tags
                    if (SNAPSHOT_FORBIDDEN_TAGS.includes(nodeName)) {
                        return null;
                    }
                    const newEl = document.createElement(el.nodeName);
                    // Drop restricted attributes
                    for (const attr of el.attributes) {
                        const omitted = SNAPSHOT_FORBIDDEN_ATTRS.some(r => r.test(attr.name));
                        if (omitted) {
                            continue;
                        }
                        try {
                            newEl.setAttribute(attr.name, attr.value);
                        } catch (e) {}
                    }
                    if (['IFRAME', 'FRAME'].includes(nodeName)) {
                        // Set a marker with frameId, so that the whole thing is later glued together
                        const rnd = Math.random()
                            .toString()
                            .substring(2);
                        newEl.setAttribute('src', `------@@${(el as any).__ubioFrameId}:${rnd}@@------`);
                    }
                    // Process descendants recursively
                    for (const childNode of el.childNodes) {
                        const clone = cloneNode(childNode);
                        if (clone) {
                            newEl.appendChild(clone);
                        }
                    }
                    if (nodeName === 'HEAD') {
                        // Add BASE if it does not exist yet
                        const base = el.querySelector('BASE');
                        if (!base) {
                            const base = document.createElement('BASE');
                            base.setAttribute('href', document.baseURI || '');
                            newEl.insertBefore(base, newEl.childNodes[0]);
                        } else {
                            base.setAttribute('href', document.baseURI || '');
                        }
                        // Also add <meta charset> if it doesn't exist
                        const metaCharset = el.querySelector('meta[charset]');
                        if (!metaCharset) {
                            const meta = document.createElement('META');
                            meta.setAttribute('charset', 'utf-8');
                            newEl.insertBefore(meta, newEl.childNodes[0]);
                        }
                    }
                    return newEl;
                }
                case 3:
                    return document.createTextNode(node.nodeValue || '');
                default:
                    return null;
            }
        }
    }

    function sendPost(url: string, postParams: Array<[string, string]>) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        for (const [key, value] of postParams) {
            const input = document.createElement('input');
            input.hidden = true;
            input.name = key;
            input.value = value;
            form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
    }
}
