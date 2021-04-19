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

import { BrowserService, CdpNode, HIGHLIGHT_CONFIG, RemoteElement } from '@automationcloud/engine';
import assert from 'assert';
import { remote } from 'electron';
import { EventEmitter } from 'events';
import { inject, injectable } from 'inversify';

import { controller } from '../controller';

const { BrowserWindow } = remote;

@injectable()
@controller({ alias: 'inspect' })
export class InspectController {

    scopeEl: RemoteElement | null = null;
    options: InspectOptions = {
        prompt: '',
        unique: false,
    };

    protected emitter: EventEmitter = new EventEmitter();

    constructor(
        @inject(BrowserService)
        protected browser: BrowserService,
    ) {
        this.browser.on('global:Overlay.inspectNodeRequested', ev => this.onInspectNodeRequested(ev));
        this.browser.on('global:Page.frameStartedLoading', ev => this.onFrameStartedLoading(ev));
        this.emitter.on('stop', () => this.onStop());
    }

    async init() {}

    /**
     * Activates an "inspect element" mode and returns clicked element with its selector.
     */
    async recordElement(
        scopeEl: RemoteElement,
        options: Partial<InspectOptions> = {},
    ): Promise<RecordElementResult | null> {
        try {
            await this.highlightScope(scopeEl);
            this.options = {
                prompt: '',
                unique: false,
                ...options,
            };
            const el = await this.grabElement(scopeEl);
            return el ? {
                element: el,
                selector: await el.createSelector(scopeEl, options.unique),
            } : null;
        } finally {
            this.hideHighlight(scopeEl);
        }
    }

    isInspecting(): boolean {
        return this.scopeEl != null;
    }

    protected async startInspect(scopeEl: RemoteElement, highlightConfig: any = HIGHLIGHT_CONFIG) {
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
        this.emitter.emit('stop');
    }

    protected async grabElement(scopeEl: RemoteElement): Promise<RemoteElement | null> {
        if (this.isInspecting()) {
            return null;
        }
        const wnd = BrowserWindow.getFocusedWindow();
        await this.startInspect(scopeEl);
        const result = await new Promise<RemoteElement | null>(resolve => {
            const onElement = (result: RemoteElement) => {
                cleanup();
                resolve(result);
            };
            const onStop = () => {
                cleanup();
                resolve(null);
            };
            const cleanup = () => {
                this.emitter.removeListener('element', onElement);
                this.emitter.removeListener('stop', onStop);
                this.stopInspect();
            };
            this.emitter.addListener('element', onElement);
            this.emitter.addListener('stop', onStop);
        });
        if (wnd) {
            wnd.focus();
        }
        return result;
    }

    protected async onInspectNodeRequested(ev: { backendNodeId: string }) {
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
            this.emitter.emit('stop');
        }
    }

    protected async resolveRemoteFromNode(scopeRemoteEl: RemoteElement, node: CdpNode): Promise<RemoteElement> {
        const { executionContext } = scopeRemoteEl;
        const { object } = await scopeRemoteEl.page.send('DOM.resolveNode', {
            nodeId: node.nodeId,
            executionContextId: executionContext.executionContextId,
        });
        return new RemoteElement(executionContext, object);
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
            scopeEl.page.toolkitBinding);
    }

    protected onStop() {
        const { scopeEl } = this;
        if (!scopeEl) {
            return;
        }
        scopeEl.page.sendAndForget('Overlay.setInspectMode', {
            mode: 'none',
            highlightConfig: HIGHLIGHT_CONFIG,
        });
        this.scopeEl = null;
    }

    protected onFrameStartedLoading(params: { frameId: string }) {
        if (this.scopeEl?.frame.frameId === params.frameId) {
            this.emitter.emit('stop');
        }
    }

}

export interface InspectOptions {
    prompt: string;
    unique: boolean;
}

export interface RecordElementResult {
    element: RemoteElement;
    selector: string;
}
