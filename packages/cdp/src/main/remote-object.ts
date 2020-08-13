import { ExecutionContext, RemoteExpression } from './execution-context';
import { CdpRemoteObject } from './types';

/**
 * Represents a reference to a remote object in JavaScript runtime of the page.
 *
 * Remote objects are returned as a result `evaluate` methods available on
 * `Page`, `Target`, `Frame`, `ExecutionContext` and `RemoteObject`.
 *
 * This API is considered low level: in most circumstances you'll will probably use
 * `evaluateJson` which returns JSON representation of a remote object
 * or more specific `evaluateElement` which returns `RemoteElement`
 * (a subclass of `RemoteObject`) with broader set of methods specific to HTML DOM elements.
 *
 * As per [CDP docs](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/)
 * Remote objects are retained in browser's memory and must be manually released
 * with `release`. Released object cannot be used and will result in exceptions
 * thrown by CDP. Reloading the page or frame also releases all the objects
 * and makes all references invalid.
 *
 * @public
 */
export class RemoteObject {

    /**
     * Creates a new RemoteObject instance. Should not be called directly,
     * unless you obtain a CDP remote object reference manually
     * (e.g. via `page.send`)
     *
     * @param executionContext Execution context this object belongs to.
     * @param cdpRemoteObject CDP [RemoteObject](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#type-RemoteObject)
     * @internal
     */
    constructor(
        readonly executionContext: ExecutionContext,
        readonly cdpRemoteObject: CdpRemoteObject
    ) {
    }

    /**
     * @returns Frame this object belongs to.
     * @public
     */
    get frame() {
        return this.executionContext.frame;
    }

    /**
     * @returns Page this object belongs to.
     * @public
     */
    get page() {
        return this.executionContext.frame.page;
    }

    /**
     * @returns Whether the object is `null` or `undefined`.
     * @public
     */
    isNull() {
        return !this.cdpRemoteObject.objectId && this.cdpRemoteObject.value == null;
    }

    /**
     * Evaluates `pageFn` in the same execution context as this object and returns `RemoteObject`.
     * This object is passed as `pageFn`'s first argument.
     *
     * @param pageFn Function to execute in page context.
     * @param args Array of additional arguments that will be available in `pageFn`.
     * @public
     */
    async evaluate(pageFn: RemoteExpression, ...args: any[]) {
        return await this.executionContext.evaluate(pageFn, this, ...args);
    }

    /**
     * Evaluates `pageFn` in the same execution context as this object and returns `RemoteElement`.
     * This object is passed as `pageFn`'s first argument, `pageFn` is expected to return a reference
     * to DOM node.
     *
     * @param pageFn Function to execute in page context.
     * @param args Array of additional arguments that will be available in `pageFn`.
     * @public
     */
    async evaluateElement(pageFn: RemoteExpression, ...args: any[]) {
        return await this.executionContext.evaluateElement(pageFn, this, ...args);
    }

    /**
     * Evaluates `pageFn` in the same execution context as this object and returns `RemoteElement`.
     * This object is passed as `pageFn`'s first argument, `pageFn` is expected to return
     * a reference to `NodeList` or any kind of enumerable of DOM nodes.
     *
     * @param pageFn Function to execute in page context.
     * @param args Array of additional arguments that will be available in `pageFn`.
     */
    async evaluateElementList(pageFn: RemoteExpression, ...args: any[]) {
        return await this.executionContext.evaluateElementList(pageFn, this, ...args);
    }

    /**
     * Evaluates `pageFn` in the same execution context as this object and returns
     * a JSON-serialized value of `pageFn` result.
     * This object is passed as `pageFn`'s first argument.
     *
     * Note: most runtime objects are not JSON-serializable. These include all DOM nodes
     * and classes like Date, RegExp, etc.
     *
     * @param pageFn Function to execute
     * @param args Array of additional arguments that will be available in `pageFn`.
     */
    async evaluateJson(pageFn: RemoteExpression, ...args: any[]) {
        return await this.executionContext.evaluateJson(pageFn, this, ...args);
    }

    /**
     * Converts this remote object reference into its JSON representation.
     * This allows working with object in engine runtime, but only applies
     * to JSON-serializable values.
     */
    async jsonValue(): Promise<any> {
        const { objectId } = this.cdpRemoteObject;
        if (this.cdpRemoteObject.objectId) {
            const { result } = await this.page.send('Runtime.callFunctionOn', {
                objectId,
                functionDeclaration: 'function() { return this; }',
                returnByValue: true,
            });
            return result.value;
        }
        return this.cdpRemoteObject.value;
    }

    /**
     * Returns a key-value map of this object's properties.
     */
    async getOwnProperties(): Promise<Map<string, RemoteObject>> {
        const { objectId } = this.cdpRemoteObject;
        const { result } = await this.page.send('Runtime.getProperties', {
            objectId,
            ownProperties: true,
        });
        const props = new Map<string, RemoteObject>();
        for (const prop of result) {
            if (prop.enumerable) {
                props.set(prop.name, this.executionContext.createRemoteObject(prop.value));
            }
        }
        return props;
    }

    /**
     * Releases this object reference, so that the page can garbage collect it.
     *
     * After releasing, working with this instance is no longer possible.
     */
    async release() {
        const { objectId } = this.cdpRemoteObject;
        if (objectId) {
            await this.page.send('Runtime.releaseObject', { objectId });
        }
    }
}
