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
import { Frame } from './frame';
import { ContentScript } from './inject';
import { RemoteElement } from './remote-element';
import { RemoteObject } from './remote-object';
import { CdpRemoteObject } from './types';

/**
 * In Chrome architecture each page/frame has a default execution context,
 * but more contexts (aka "isolated worlds") can be created.
 * Objects do not "see" each other between execution contexts.
 *
 * FrameManager keeps track of default execution context of the page,
 * so in most circumstances you do not need to work with this class directly.
 * Instead, you use corresponding methods on `Page`, `Frame`,
 * `RemoteElement` and `RemoteObject` instances.
 */
export class ExecutionContext {

    /**
     * Creates a new execution context.
     *
     * @param frame Frame this execution context belongs to.
     * @param executionContextId Id obtained from CDP methods/events.
     */
    constructor(
        readonly frame: Frame,
        readonly executionContextId: string
    ) {}

    /**
     * @returns The page this execution context belongs to.
     */
    get page() {
        return this.frame.page;
    }

    /**
     * Evaluates `pageFn` in the this execution context, returning a remote reference to result.
     * This should only be used to hold references to values on the page, which are not JSON-serializable
     * (e.g. DOM nodes, instances of Date, RegExp, etc).
     *
     * Use `evaluateJson` instead if you just need to obtain a JSON value (i.e. a string, a JSON object, etc).
     *
     * @param pageFn Function to execute
     * @param args Array of arguments that will be available in `pageFn`.
     */
    async evaluate(pageFn: RemoteExpression, ...args: any[]): Promise<RemoteObject> {
        const { executionContextId } = this;
        const functionDeclaration = pageFn.toString();
        const argv = args.map(arg => this.convertArgument(arg));
        const { result, exceptionDetails } = await this.page.send('Runtime.callFunctionOn', {
            functionDeclaration,
            executionContextId,
            arguments: argv,
            returnByValue: false,
            userGesture: true,
            awaitPromise: true,
        });
        if (exceptionDetails) {
            const err = this.convertException(exceptionDetails);
            this.frame.emit('evaluateError', err);
            throw err;
        }
        return this.createRemoteObject(result);
    }

    /**
     * Evaluates `pageFn` in the this execution context, returning a JSON-serialized value
     * of `pageFn` result.
     *
     * @param pageFn Function to execute
     * @param args Array of arguments that will be available in `pageFn`.
     */
    async evaluateJson(pageFn: RemoteExpression, ...args: any[]): Promise<any> {
        const { executionContextId } = this;
        const functionDeclaration = pageFn.toString();
        const argv = args.map(arg => this.convertArgument(arg));
        const { result, exceptionDetails } = await this.page.send('Runtime.callFunctionOn', {
            functionDeclaration,
            executionContextId,
            arguments: argv,
            returnByValue: true,
            userGesture: true,
            awaitPromise: true,
        });
        if (exceptionDetails) {
            const err = this.convertException(exceptionDetails);
            this.frame.emit('evaluateError', err);
            throw err;
        }
        return result.value;
    }

    /**
     * Evaluates `pageFn` in the this execution context and returns `RemoteElement`.
     * `pageFn` is expected to return a reference to DOM node.
     *
     * @param pageFn Function to execute
     * @param args Array of arguments that will be available in `pageFn`.
     */
    async evaluateElement(pageFn: RemoteExpression, ...args: any[]): Promise<RemoteElement | null> {
        const res = await this.evaluate(pageFn, ...args);
        if (!(res instanceof RemoteElement) || res.isNull()) {
            return null;
        }
        return res;
    }

    /**
     * Evaluates `pageFn` in the this execution context and returns `RemoteElement`.
     * `pageFn` is expected to return a reference to `NodeList` or any kind of
     * enumerable of DOM nodes.
     *
     * @param pageFn Function to execute
     * @param args Array of arguments that will be available in `pageFn`.
     */
    async evaluateElementList(pageFn: RemoteExpression, ...args: any[]): Promise<RemoteElement[]> {
        const nodeList = await this.evaluate(pageFn, ...args);
        return this.nodeListToElements(nodeList);
    }

    /**
     * Converts a reference to Iterable<Node> into an array of RemoteElement references.
     *
     * @internal
     */
    async nodeListToElements(nodeList: RemoteObject): Promise<RemoteElement[]> {
        const properties = await nodeList.getOwnProperties();
        await nodeList.release();
        const result = [];
        for (let i = 0; i < properties.size; i++) {
            result.push(properties.get(i.toString()) as RemoteElement);
        }
        return result;
    }

    createRemoteObject(cdpRemoteObject: CdpRemoteObject) {
        const { subtype } = cdpRemoteObject;
        if (subtype === 'node') {
            // Note: description will contain nodeName for elements
            return new RemoteElement(this, cdpRemoteObject);
        }
        return new RemoteObject(this, cdpRemoteObject);
    }

    protected convertArgument(arg: any): CallArgument {
        if (arg == null) {
            return { value: null };
        }
        if (arg instanceof RemoteObject) {
            if (arg.cdpRemoteObject.objectId) {
                return { objectId: arg.cdpRemoteObject.objectId };
            }
            return { value: arg.cdpRemoteObject.value };
        }
        return { value: arg };
    }

    protected convertException(exceptionDetails: ExceptionDetails): Error {
        const { exception, text, stackTrace } = exceptionDetails;
        let msg = text;
        if (exception && exception.description) {
            msg = exception.description;
            // Note: exception.description already contains stack trace
        } else if (stackTrace) {
            for (const cf of stackTrace.callFrames) {
                const location = cf.url + ':' + cf.lineNumber + ':' + cf.columnNumber;
                const functionName = cf.functionName || '<anonymous>';
                msg += `\n    at ${functionName} (${location})`;
            }
        }
        // CDP bug: rejected promise is returned with this ugly prefix, despite `awaitPromise: true`
        msg = msg.replace(/^Uncaught \(in promise\)\s+/, '');
        return new Exception({
            name: 'EvaluateFailed',
            message: msg,
            retry: true,
        });
    }

    initContentScripts(scripts: ContentScript[]) {
        const options = {
            toolkitBinding: this.page.toolkitBinding,
        };
        for (const { fn, filename } of scripts) {
            const source = `(${fn.toString()})(${JSON.stringify(options)})\n//# sourceURL=${filename}\n`;
            this.page.sendAndForget('Runtime.evaluate', {
                contextId: this.executionContextId,
                expression: source,
            });
        }
    }
}

export type RemoteExpression = string | ((...args: any[]) => any);

type CallArgument = { value: any } | { objectId: string };

interface ExceptionDetails {
    exception?: { description?: string; value: string };
    text: string;
    stackTrace?: { callFrames: CallFrame[] };
}

interface CallFrame {
    functionName: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
}
