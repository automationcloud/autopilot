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

import { HIGHLIGHT_CONFIG } from './constants';
import { Page } from './page';
import { RemoteElement } from './remote-element';
import { CdpNode } from './types';

/**
 * Maintains stateful CDP DOM client, similar to DevTools "Elements" tab.
 *
 * Note: DOM tracking is disabled by default and is only enabled in Autopilot
 * for selector building features.
 *
 * @internal
 */
export class DomManager {
    page: Page;
    nodesMap: Map<number, CdpNode> = new Map();
    updatesCounter: number = 1;
    eventListeners: Array<[string, (...args: any[]) => void]>;

    constructor(page: Page) {
        this.page = page;
        this.eventListeners = [
            ['DOM.documentUpdated', this.invalidate.bind(this)],
            ['DOM.setChildNodes', this.onSetChildNodes.bind(this)],
            ['DOM.attributeModified', this.onAttributeModified.bind(this)],
            ['DOM.attributeRemoved', this.onAttributeRemoved.bind(this)],
            ['DOM.childNodeInserted', this.onChildNodeInserted.bind(this)],
            ['DOM.childNodeRemoved', this.onChildNodeRemoved.bind(this)],
            ['DOM.childNodeCountUpdated', this.onChildNodeCountUpdated.bind(this)],
            ['DOM.characterDataModified', this.onCharacterDataModified.bind(this)],
            ['DOM.pseudoElementAdded', this.onPseudoElementAdded.bind(this)],
            ['DOM.pseudoElementRemoved', this.onPseudoElementRemoved.bind(this)],
        ];
    }

    enable() {
        this.page.sendAndForget('DOM.enable');
        for (const [ev, listener] of this.eventListeners) {
            this.page.target.addListener(ev, listener);
        }
        this.invalidate();
    }

    disable() {
        this.nodesMap.clear();
        for (const [ev, listener] of this.eventListeners) {
            this.page.target.removeListener(ev, listener);
        }
        this.page.sendAndForget('DOM.disable');
    }

    invalidate() {
        this.nodesMap.clear();
        this.page.send('DOM.getDocument').then(
            res => this.registerNode(null, res.root),
            () => {},
        );
    }

    getNodeById(nodeId: number): CdpNode | null {
        return (this.updatesCounter && this.nodesMap.get(nodeId)) || null;
    }

    async resolveNodeFromEl(el: RemoteElement): Promise<CdpNode | null> {
        const { objectId } = el;
        const { nodeId } = await el.page.send('DOM.requestNode', { objectId });
        return this.getNodeById(nodeId);
    }

    requestChildNodes(nodeId: number) {
        this.page.sendAndForget('DOM.requestChildNodes', {
            nodeId,
            depth: 3,
        });
    }

    async querySelectorAll(nodeId: number, selector: string): Promise<number[]> {
        const { nodeIds } = await this.page.send('DOM.querySelectorAll', { nodeId, selector });
        return nodeIds;
    }

    highlightElement(el: RemoteElement) {
        this.resolveNodeFromEl(el)
            .catch(() => null)
            .then(node => {
                if (node) {
                    this.highlightNode(node);
                }
            });
    }

    highlightNode(node: CdpNode, highlightConfig: any = HIGHLIGHT_CONFIG) {
        this.page.sendAndForget('Overlay.highlightNode', {
            nodeId: node.nodeId,
            highlightConfig,
        });
    }

    hideHighlight() {
        this.page.sendAndForget('Overlay.hideHighlight');
    }

    convertAttributes(cdpAttributes = []) {
        const attrs = {};
        for (let i = 0; i < cdpAttributes.length; i += 2) {
            attrs[cdpAttributes[i]] = cdpAttributes[i + 1];
        }
        return attrs;
    }

    parseClassList(classAttr: string) {
        return (classAttr || '').split(/\s+/g).filter(Boolean);
    }

    // Tracking

    registerNode(parentNode: CdpNode | null, cdpNode: CdpNode): void {
        const node = cdpNode;
        node.parentId = parentNode ? parentNode.nodeId : null;
        node.ownerDocumentId = node.nodeType === 9 ? node.nodeId : parentNode ? parentNode.ownerDocumentId : null;
        node.children = node.children || null;
        node.pseudoElements = node.pseudoElements || null;
        this.nodesMap.set(node.nodeId, node);
        this.updatesCounter += 1;
        if (node.children) {
            node.children.forEach(child => {
                this.registerNode(node, child);
            });
        }
        if (node.contentDocument) {
            this.registerNode(node, node.contentDocument);
        }
        if (node.pseudoElements) {
            for (const pseudoChild of node.pseudoElements) {
                this.registerNode(node, pseudoChild);
            }
        }
    }

    unregisterNode(node: CdpNode) {
        this.nodesMap.delete(node.nodeId);
        this.updatesCounter += 1;
        if (node.children) {
            node.children.forEach(child => {
                this.unregisterNode(child);
            });
        }
        if (node.contentDocument) {
            this.unregisterNode(node.contentDocument);
        }
        if (node.pseudoElements) {
            for (const pseudoChild of node.pseudoElements) {
                this.unregisterNode(pseudoChild);
            }
        }
    }

    // Event Listeners

    onSetChildNodes(params: { parentId: number; nodes: CdpNode[] }) {
        const { parentId, nodes } = params;
        const parentNode = this.nodesMap.get(parentId);
        if (!parentNode) {
            return;
        }
        parentNode.children = nodes;
        nodes.forEach(node => {
            this.registerNode(parentNode, node);
        });
    }

    onAttributeModified(params: { nodeId: number; name: string; value: string }) {
        const { nodeId, name, value } = params;
        const node = this.nodesMap.get(nodeId);
        if (node && node.attributes) {
            removeAttr(node, name);
            node.attributes.push(name, value);
        }
    }

    onAttributeRemoved(params: { nodeId: number; name: string }) {
        const { nodeId, name } = params;
        const node = this.nodesMap.get(nodeId);
        if (node && node.attributes) {
            removeAttr(node, name);
        }
    }

    onChildNodeInserted(params: { parentNodeId: number; previousNodeId: number; node: CdpNode }) {
        const { parentNodeId, previousNodeId, node } = params;
        const parentNode = this.nodesMap.get(parentNodeId);
        if (!parentNode) {
            return;
        }
        this.registerNode(parentNode, node);
        if (!parentNode.children) {
            return;
        }
        const prevIdx = parentNode.children.findIndex(n => n.nodeId === previousNodeId);
        parentNode.children.splice(prevIdx + 1, 0, node);
    }

    onChildNodeRemoved(params: { parentNodeId: number; nodeId: number }) {
        const { parentNodeId, nodeId } = params;
        const removedNode = this.nodesMap.get(nodeId);
        if (removedNode) {
            // Un-register all descendants recursively
            this.unregisterNode(removedNode);
        }
        // Un-register this child from parent node
        const parentNode = this.nodesMap.get(parentNodeId);
        if (!parentNode || !parentNode.children) {
            return;
        }
        const i = parentNode.children.findIndex(n => n.nodeId === nodeId);
        if (i > -1) {
            parentNode.children.splice(i, 1);
        }
    }

    onChildNodeCountUpdated(params: { nodeId: number; childNodeCount: number }) {
        const { nodeId, childNodeCount } = params;
        const node = this.nodesMap.get(nodeId);
        if (node) {
            node.childNodeCount = childNodeCount;
        }
    }

    onCharacterDataModified(params: { nodeId: number; characterData: string }) {
        const { nodeId, characterData } = params;
        const node = this.nodesMap.get(nodeId);
        if (node) {
            node.nodeValue = characterData;
        }
    }

    onPseudoElementAdded(params: { parentId: number; pseudoElement: CdpNode }) {
        const { parentId, pseudoElement } = params;
        const parentNode = this.nodesMap.get(parentId);
        if (!parentNode) {
            return;
        }
        this.registerNode(parentNode, pseudoElement);
    }

    onPseudoElementRemoved(params: { pseudoElementId: number }) {
        const { pseudoElementId } = params;
        const node = this.nodesMap.get(pseudoElementId);
        if (node) {
            this.unregisterNode(node);
        }
    }
}

// Utils

function removeAttr(node: CdpNode, name: string) {
    if (!node.attributes) {
        return;
    }
    for (let i = 0; i < node.attributes.length; i += 2) {
        if (node.attributes[i] === name) {
            node.attributes.splice(i, 2);
            return;
        }
    }
}
