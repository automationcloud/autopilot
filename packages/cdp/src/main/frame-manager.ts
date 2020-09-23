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

import { Page } from './page';
import { Frame } from './frame';
import {
    CdpFrameTree,
    CdpFrame,
    CdpRequestWillBeSent,
    CdpResponseReceived,
    CdpLoadingFailed,
    CdpLoadingFinished,
} from './types';

/**
 * Keeps track of page frames.
 *
 * @internal
 */
export class FrameManager {
    page: Page;
    frames: Map<string, Frame> = new Map();
    mainFrame: Frame;

    constructor(page: Page, frameTree: CdpFrameTree) {
        this.page = page;
        const { target } = page;
        this.mainFrame = this.registerFrame(frameTree.frame.id);
        this.registerFrameTree(frameTree);
        target.on('Page.frameAttached', ev => this.onFrameAttached(ev.frameId, ev.parentFrameId));
        target.on('Page.frameNavigated', ev => this.onFrameNavigated(ev.frame));
        target.on('Page.navigatedWithinDocument', ev => this.onNavigatedWithinDocument(ev.frameId, ev.url));
        target.on('Page.frameDetached', ev => this.onFrameDetached(ev.frameId));
        target.on('Page.lifecycleEvent', ev => this.onLifecycleEvent(ev));
        target.on('Page.frameStoppedLoading', ev => this.onFrameStoppedLoading(ev.frameId));
        target.on('Network.requestWillBeSent', ev => this.onRequestWillBeSent(ev));
        target.on('Network.responseReceived', ev => this.onResponseReceived(ev));
        target.on('Network.loadingFinished', ev => this.onLoadingFinished(ev));
        target.on('Network.loadingFailed', ev => this.onLoadingFailed(ev));
        target.on('Runtime.executionContextCreated', ev => this.onExecutionContextCreated(ev.context));
        target.on('Runtime.executionContextDestroyed', ev => this.onExecutionContextDestroyed(ev.executionContextId));
        target.on('Runtime.executionContextsCleared', () => this.onExecutionContextsCleared());
    }

    getFrameById(id: string): Frame | undefined {
        return this.frames.get(id);
    }

    findFrameByRequestId(requestId: string): Frame | undefined {
        for (const frame of this.frames.values()) {
            if (frame.requestId === requestId) {
                return frame;
            }
        }
    }

    private registerFrameTree(frameTree: CdpFrameTree) {
        const { frame, childFrames } = frameTree;
        if (frame.parentId) {
            this.onFrameAttached(frame.id, frame.parentId);
        }
        this.onFrameNavigated(frame);
        if (childFrames) {
            for (const child of childFrames) {
                this.registerFrameTree(child);
            }
        }
    }

    private registerFrame(frameId: string, parentFrameId?: string): Frame {
        if (this.frames.has(frameId)) {
            return this.frames.get(frameId)!;
        }
        const parentFrame = parentFrameId ? this.getFrameById(parentFrameId) : undefined;
        const frame = new Frame(this.page, frameId, parentFrame);
        this.frames.set(frameId, frame);
        if (!parentFrameId) {
            this.mainFrame = frame;
        }
        return frame;
    }

    private unregisterFrame(frame: Frame) {
        this.frames.delete(frame.frameId);
        if (frame.parentFrame) {
            frame.parentFrame.childFrames.delete(frame);
        }
        for (const child of frame.childFrames) {
            this.unregisterFrame(child);
        }
    }

    private onFrameAttached(frameId: string, parentFrameId: string) {
        this.registerFrame(frameId, parentFrameId);
    }

    private onFrameNavigated(cdpFrame: CdpFrame) {
        const { id, parentId } = cdpFrame;
        const existingFrame = this.getFrameById(id);
        if (existingFrame) {
            // Detach children
            for (const child of existingFrame.childFrames) {
                this.unregisterFrame(child);
            }
            // Update frame id to retain frame identity on cross-process navigation
            if (existingFrame.isMainFrame()) {
                existingFrame.frameId = id;
                this.frames.delete(id);
                this.frames.set(id, existingFrame);
            }
            // Update navigation status
            existingFrame.onNavigated(cdpFrame);
        } else {
            // Initial top-frame navigation
            const newFrame = this.registerFrame(id, parentId);
            newFrame.onNavigated(cdpFrame);
        }
    }

    private onNavigatedWithinDocument(frameId: string, url: string) {
        const frame = this.getFrameById(frameId);
        if (frame) {
            frame.url = url;
        }
    }

    private onFrameDetached(frameId: string) {
        const frame = this.getFrameById(frameId);
        if (frame) {
            this.unregisterFrame(frame);
        }
    }

    private onFrameStoppedLoading(frameId: string) {
        const frame = this.getFrameById(frameId);
        if (frame) {
            frame.onStoppedLoading();
        }
    }

    private onLifecycleEvent(event: LifecycleEvent) {
        const { frameId, name } = event;
        const frame = this.getFrameById(frameId);
        if (frame) {
            frame.onLifecycleEvent(name);
        }
    }

    private onRequestWillBeSent(event: CdpRequestWillBeSent) {
        const { type, frameId, requestId, request } = event;
        if (type !== 'Document') {
            return;
        }
        const frame = this.getFrameById(frameId);
        if (frame) {
            frame.onRequestWillBeSent(requestId, request);
        }
    }

    private onResponseReceived(event: CdpResponseReceived) {
        const { type, frameId, response, requestId } = event;
        if (type !== 'Document') {
            return;
        }
        const frame = this.getFrameById(frameId);
        if (frame) {
            frame.onResponseReceived(requestId, response);
        }
    }

    private onLoadingFinished(event: CdpLoadingFinished) {
        const { requestId } = event;
        const frame = this.findFrameByRequestId(requestId);
        if (frame) {
            frame.onLoadingFinished(requestId);
        }
    }

    private onLoadingFailed(event: CdpLoadingFailed) {
        const { requestId, type, errorText } = event;
        if (type !== 'Document') {
            return;
        }
        const frame = this.findFrameByRequestId(requestId);
        if (frame) {
            frame.onLoadingFailed(requestId, errorText);
        }
    }

    private onExecutionContextCreated(context: any) {
        const frameId = (context.auxData || {}).frameId || '';
        const frame = this.getFrameById(frameId);
        if (frame) {
            frame.onExecutionContextCreated(context);
        }
    }

    private onExecutionContextDestroyed(executionContextId: string) {
        for (const frame of this.frames.values()) {
            frame.onExecutionContextDestroyed(executionContextId);
        }
    }

    private onExecutionContextsCleared() {
        for (const frame of this.frames.values()) {
            frame.onExecutionContextsCleared();
        }
    }
}

interface LifecycleEvent {
    frameId: string;
    name: string;
}
