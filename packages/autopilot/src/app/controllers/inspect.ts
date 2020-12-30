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

import { RemoteElement, BrowserService, HIGHLIGHT_CONFIG, CdpNode } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';
import { controller } from '../controller';
import { remote } from 'electron';
const { BrowserWindow } = remote;
import assert from 'assert';
import { EventEmitter } from 'events';

@injectable()
@controller({ alias: 'inspect' })
export class InspectController {

    scopeEl: RemoteElement | null = null;
    prompt: string = '';

    protected emitter: EventEmitter = new EventEmitter();

    constructor(
        @inject(BrowserService)
        protected browser: BrowserService,
    ) {
        // TODO stop inspect on Escape
        this.browser.on('global:Overlay.inspectNodeRequested', ev => this.onInspectNodeRequested(ev));
    }

    async init() {}

    /**
     * Activates an "inspect element" mode and returns clicked element with its selector.
     */
    async recordElement(
        scopeEl: RemoteElement,
        options: RecordElementOptions = {},
    ): Promise<RecordElementResult | null> {
        const { prompt = '', unique = false } = options;
        try {
            await this.highlightScope(scopeEl);
            const el = await this.grabElement(scopeEl, prompt);
            if (el) {
                return {
                    element: el,
                    selector: await el.createSelector(scopeEl, unique),
                };
            }
            return null;
        } finally {
            this.hideHighlight(scopeEl);
        }
    }

    isInspecting(): boolean {
        return this.scopeEl != null;
    }

    async startInspect(scopeEl: RemoteElement, highlightConfig: any = HIGHLIGHT_CONFIG) {
        if (this.isInspecting()) {
            return;
        }
        this.scopeEl = scopeEl;
        await scopeEl.page.activate();
        await scopeEl.page.send('Overlay.enable');
        await scopeEl.page.send('Overlay.setInspectMode', {
            mode: 'searchForNode',
            highlightConfig,
        });
    }

    stopInspect() {
        const { scopeEl } = this;
        if (!scopeEl) {
            return;
        }
        scopeEl.page.sendAndForget('Overlay.setInspectMode', {
            mode: 'none',
            highlightConfig: HIGHLIGHT_CONFIG,
        });
        this.scopeEl = null;
        this.emitter.emit('stop');
    }

    async grabElement(scopeEl: RemoteElement, prompt: string = ''): Promise<RemoteElement | null> {
        if (this.isInspecting()) {
            return null;
        }
        const wnd = BrowserWindow.getFocusedWindow();
        this.prompt = prompt;
        await this.startInspect(scopeEl);
        const result = await new Promise<RemoteElement | null>(resolve => {
            const inspector = this;
            inspector.emitter.addListener('element', onElement);
            inspector.emitter.addListener('stop', onStop);

            function onElement(result: RemoteElement) {
                cleanup();
                resolve(result);
            }

            function onStop() {
                cleanup();
                resolve(null);
            }

            function cleanup() {
                inspector.emitter.removeListener('element', onElement);
                inspector.emitter.removeListener('stop', onStop);
                inspector.stopInspect();
            }
        });
        if (wnd) {
            wnd.focus();
        }
        return result;
    }

    async onInspectNodeRequested(ev: { backendNodeId: string }) {
        try {
            const scopeEl = this.scopeEl!;
            assert(scopeEl, 'Invalid state: no element in scope');
            const domManager = scopeEl.page.domManager;
            const scopeNode = (await domManager.resolveNodeFromEl(scopeEl))!;
            assert(scopeNode, 'Scope node does not exist in DOM');
            const { nodeIds } = await scopeEl.page.send('DOM.pushNodesByBackendIdsToFrontend', {
                backendNodeIds: [ev.backendNodeId],
            });
            const nodeId = nodeIds[0];
            let node: CdpNode = domManager.getNodeById(nodeId)!;
            if (node && node.pseudoType) {
                // Resolve pseudo-elements to their parents
                node = domManager.getNodeById(node.parentId || 0)!;
            }
            if (node == null || node.nodeType !== 1) {
                // We're only interested in elements
                return;
            }
            // Resolve elements from iframes to top-level <iframe> element
            while (node.ownerDocumentId !== scopeNode.ownerDocumentId) {
                const ownerDocNode = domManager.getNodeById(node.ownerDocumentId!)!;
                node = domManager.getNodeById(ownerDocNode.parentId!)!;
            }
            const el = await this.resolveRemoteFromNode(scopeEl, node);
            // Make sure element belongs to scopeEl
            const contains = await scopeEl.contains(el);
            if (!contains) {
                return;
            }
            this.emitter.emit('element', el);
        } catch (err) {
            console.error('Inspect element failed', err);
        }
    }

    async resolveRemoteFromNode(scopeRemoteEl: RemoteElement, node: CdpNode): Promise<RemoteElement> {
        const { object } = await scopeRemoteEl.page.send('DOM.resolveNode', { nodeId: node.nodeId });
        return new RemoteElement(scopeRemoteEl.executionContext, object);
    }

    async highlightScope(scopeEl: RemoteElement) {
        await scopeEl.evaluate((scopeEl: HTMLElement, toolkitBinding: string) => {
            (window as any)[toolkitBinding].showRect(scopeEl, {
                color: 'transparent',
                shadow: '0 0 0 999999px rgba(0,0,0,.75)',
            });
            // Add indication for iframes
            for (const frameEl of scopeEl.querySelectorAll('frame, iframe')) {
                (window as any)[toolkitBinding].showRect(frameEl, {
                    color: 'hsla(48, 75%, 75%, .5)',
                });
            }
        }, scopeEl.page.toolkitBinding);
    }

    async hideHighlight(scopeEl: RemoteElement) {
        scopeEl.evaluate(
            (el: HTMLElement, toolkitBinding: string) => (window as any)[toolkitBinding].hideAllRects(),
            scopeEl.page.toolkitBinding,
        );
    }

}

export interface RecordElementOptions {
    prompt?: string;
    unique?: boolean;
}

export interface RecordElementResult {
    element: RemoteElement;
    selector: string;
}
