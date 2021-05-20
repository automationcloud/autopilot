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

import WebSocket from 'ws';

import { Browser } from './browser';
import { Exception } from './exception';
import { Target } from './target';
import { CdpTargetInfo } from './types';

const TARGET_ATTACH_TIMEOUT = 1000;

/**
 * Manages low-level CDP connection details.
 *
 * @internal
 */
export class Connection {
    protected browser: Browser;
    protected sessions: Map<string, Target> = new Map();
    protected ws: WebSocket | null = null;
    protected awaitingCommands: Map<number, CommandHandler> = new Map();
    protected nextCommandId: number = 1;

    protected listeners = {
        onMessage: this.onMessage.bind(this),
        onClose: this.onClose.bind(this),
    };

    constructor(browser: Browser) {
        this.browser = browser;
        browser.on('global:Target.targetCreated', ev => this.onTargetCreated(ev));
        browser.on('global:Target.targetDestroyed', ev => this.onTargetDestroyed(ev));
        browser.on('global:Target.attachedToTarget', ev => this.onAttachedToTarget(ev));
        browser.on('global:Target.detachedFromTarget', ev => this.onDetachedFromTarget(ev));
        browser.on('global:Target.targetInfoChanged', ev => this.onTargetInfoChanged(ev));
    }

    isConnected() {
        return this.ws != null;
    }

    async connect(webSocketDebuggerUrl: string) {
        if (this.ws) {
            return;
        }
        return new Promise<void>((resolve, reject) => {
            const ws = new WebSocket(webSocketDebuggerUrl, {
                perMessageDeflate: false,
            });
            ws.on('open', () => {
                this.attachWebSocket(ws);
                resolve();
            });
            ws.on('error', reject);
        });
    }

    attachWebSocket(ws: WebSocket) {
        if (this.ws) {
            return;
        }
        ws.addListener('message', this.listeners.onMessage);
        ws.addListener('close', this.listeners.onClose);
        this.ws = ws;
        this.browser.emit('connect');
    }

    detachWebSocket() {
        const { ws } = this;
        if (!ws) {
            return;
        }
        ws.removeListener('message', this.listeners.onMessage);
        ws.removeListener('close', this.listeners.onClose);
        this.ws = null;
        this.browser.emit('disconnect');
        this.rejectAll(cmd => {
            return new Exception({
                name: 'CdpDisconnected',
                message: 'CDP: connection to browser endpoint lost',
                retry: true,
                details: { method: cmd.method, params: cmd.params },
            });
        });
        this.awaitingCommands.clear();
        this.sessions.clear();
    }

    disconnect() {
        if (!this.ws) {
            return;
        }
        this.ws.close();
    }

    rejectAllForTarget(sessionId: string, errFn: (handler: CommandHandler) => Error) {
        for (const handler of this.awaitingCommands.values()) {
            if (handler.sessionId === sessionId) {
                const err = errFn(handler);
                handler.reject(err);
            }
        }
    }

    rejectAll(errFn: (handler: CommandHandler) => Error) {
        for (const handler of this.awaitingCommands.values()) {
            const err = errFn(handler);
            handler.reject(err);
        }
    }

    getTarget(sessionId: string): Target {
        if (!this.sessions.has(sessionId)) {
            throw new Exception({
                name: 'CdpInvalidTarget',
                message: 'CDP: invalid target requested (most likely it is destroyed)',
                retry: true,
                details: {
                    sessionId,
                },
            });
        }
        return this.sessions.get(sessionId)!;
    }

    async waitForTarget(targetId: string): Promise<Target> {
        const timeoutAt = Date.now() + TARGET_ATTACH_TIMEOUT;
        while (Date.now() < timeoutAt) {
            const target = this.findTargetById(targetId);
            if (target) {
                return target;
            }
            await new Promise(r => setTimeout(r, 50));
        }
        throw new Exception({
            name: 'CdpInvalidTarget',
            message: 'CDP: invalid target requested (most likely it is destroyed)',
            retry: true,
            details: {
                targetId,
            },
        });
    }

    findTargetById(targetId: string): Target | null {
        for (const target of this.sessions.values()) {
            if (target.targetId === targetId) {
                return target;
            }
        }
        return null;
    }

    addSession(sessionId: string, targetInfo: CdpTargetInfo) {
        const target = new Target(this.browser, sessionId, targetInfo);
        this.sessions.set(sessionId, target);
        this.browser.emit('targetAttached', target);
    }

    removeSession(sessionId: string): void {
        this.rejectAllForTarget(sessionId, cmd => {
            const { method, params } = cmd;
            return new Exception({
                name: 'CdpTargetDetached',
                message: 'CDP: detached from target',
                retry: true,
                details: { method, params }
            });
        });
        const target = this.sessions.get(sessionId);
        if (target) {
            this.sessions.delete(sessionId);
            this.browser.emit('targetDetached', target);
        }
    }

    sendAndForget(payload: Command) {
        if (this.ws) {
            const { method, params, sessionId } = payload;
            const id = this.nextCommandId;
            this.nextCommandId += 1;
            const message = { id, method, params, sessionId };
            this.ws.send(JSON.stringify(message));
        }
    }

    async send(command: Command): Promise<any> {
        const { method, params, sessionId, timeout = this.browser.config.cdpTimeout } = command;
        return new Promise((resolve, reject) => {
            if (!this.ws) {
                throw new Exception({
                    name: 'CdpNotConnected',
                    message: 'CDP: not connected to browser endpoint',
                    retry: true,
                    details: { method, params },
                });
            }
            if (this.ws.readyState > 1) {
                // Connection is down, but no close event fired
                // https://github.com/websockets/ws/issues/1125
                this.onClose();
                throw new Exception({
                    name: 'CdpDisconnected',
                    message: 'CDP: connection to browser endpoint lost',
                    retry: true,
                    details: { method, params },
                });
            }
            const { awaitingCommands } = this;
            const id = this.nextCommandId;
            this.nextCommandId += 1;
            const timer = setTimeout(() => {
                const err = new Exception({
                    name: 'CdpTimeout',
                    message: 'CDP: timeout while waiting for command result',
                    retry: false,
                    details: { method, params },
                });
                handler.reject(err);
            }, timeout);
            const handler = {
                id,
                method,
                params,
                sessionId,
                resolve(result: any) {
                    awaitingCommands.delete(id);
                    clearTimeout(timer);
                    resolve(result);
                },
                reject(err: Error) {
                    awaitingCommands.delete(id);
                    clearTimeout(timer);
                    // err.stack = stack;
                    reject(err);
                },
            };
            awaitingCommands.set(id, handler);
            const message = { id, method, params, sessionId };
            this.ws.send(JSON.stringify(message));
        });
    }

    attachedTargets() {
        return this.sessions.values();
    }

    protected onClose() {
        this.detachWebSocket();
    }

    protected onMessage(data: string) {
        const message = JSON.parse(data);
        if (message.id) {
            // Command response
            const handler = this.awaitingCommands.get(message.id);
            // Handler may be removed if rejected already (e.g. timeout or rejectAll)
            if (!handler) {
                return;
            }
            if (message.error) {
                const { method, params } = handler;
                handler.reject(
                    new Exception({
                        name: 'CdpCommandFailed',
                        message: `CDP command failed: ${method}: ${message.error.message}`,
                        retry: true,
                        details: { method, params },
                    }),
                );
            } else {
                handler.resolve(message.result);
            }
        } else {
            // Event
            const { method, params, sessionId } = message;
            const domain = method.replace(/\..*/, '');
            // Emit global events (browser + all targets)
            this.browser.emit('global:cdp', message);
            this.browser.emit('global:cdp.' + domain, message);
            this.browser.emit('global:' + method, params);
            if (sessionId) {
                const target = this.sessions.get(sessionId);
                if (target) {
                    // Emit target-scoped events
                    target.emit('cdp', message);
                    target.emit('cdp.' + domain, message);
                    target.emit(method, params);
                }
            } else {
                // Emit browser-scoped events
                this.browser.emit('cdp', message);
                this.browser.emit('cdp.' + domain, message);
                this.browser.emit(method, params);
            }
        }
    }

    protected onTargetCreated(params: { targetInfo: CdpTargetInfo }) {
        const { targetId } = params.targetInfo;
        this.sendAndForget({
            method: 'Target.attachToTarget',
            params: {
                targetId,
                flatten: true,
            },
        });
    }

    protected onTargetDestroyed(params: { targetId: string }) {
        const { targetId } = params;
        const target = this.findTargetById(targetId);
        if (target) {
            this.removeSession(target.sessionId);
        }
    }

    protected onAttachedToTarget(params: { sessionId: string; targetInfo: CdpTargetInfo }) {
        const { sessionId, targetInfo } = params;
        this.addSession(sessionId, targetInfo);
    }

    protected onDetachedFromTarget(params: { sessionId: string }) {
        const { sessionId } = params;
        this.removeSession(sessionId);
    }

    protected onTargetInfoChanged(params: { targetInfo: CdpTargetInfo }) {
        const { targetId } = params.targetInfo;
        const target = this.findTargetById(targetId);
        if (target) {
            target.onInfoChanged(params.targetInfo);
        }
    }
}

interface CommandHandler {
    id: number;
    method: string;
    sessionId?: string;
    params: any;
    resolve(result: any): void;
    reject(err: Error): void;
}

export interface Command {
    method: string;
    params?: any;
    sessionId?: string;
    timeout?: number;
}
