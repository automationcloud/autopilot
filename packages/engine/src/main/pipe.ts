import uuid from 'uuid';
import * as util from './util';
import { Pipeline } from './pipeline';
import { RuntimeCtx } from './runtime';
import { Action } from './action';
import { Element } from './element';
import { Module } from './module';
import { Unit } from './unit';

export interface PipeClass extends Module {
    new ($parent: Pipeline): Pipe;
}

/**
 * Pipes are primary units of computation in Automation Scripts.
 *
 * Each pipe transforms an array of {@link Element} (referred to as List) into
 * another array of elements based on some logic.
 *
 * Some pipes would work with DOM, some pipes will modify the value, other pipes will
 * modify the entire list.
 *
 * Pipes are assembled in chains called Pipelines and are designed with composability in mind.
 * Specifically, each pipe typically does only one thing at a time, with minimal assumptions
 * on the data structures and the environment they execute in. This allows for great scripting
 * flexibility when different kinds of pipes can be used together to achieve a broad variety
 * of data manipulation goals.
 *
 * @public
 */
export abstract class Pipe extends Unit<Pipeline> {
    /**
     * Pipes don't have icon representation, so `$icon` field is ignored.
     * @internal
     */
    static $icon = '';

    /**
     * Unique ID of this action instance.
     * Must be unique within a Script, across all entities
     * @public
     */
    id: string = uuid.v4();

    /**
     * User-specified custom label rendered instead of default "hints".
     */
    label: string = '';

    /**
     * User-specified notes.
     * @public
     */
    notes: string = '';

    /**
     * Indicates whether the pipe is enabled. Disabled pipes are bypassed, passing the same list through.
     * @public
     */
    enabled: boolean = true;

    /**
     * Actual implementation of pipe.
     *
     * Input `list` contains an array of {@link Element} produced by previous pipe (or by Action scope).
     * The result must be a list of other elements.
     *
     * Note: whenever pipe modifies element value or DOM node, it needs to create a clone.
     * Use {@link Element.clone} for that. If modification is done in-place, then it is possible
     * to create counter-intuitive side-effects in both UI and runtime.
     * Cloning is not performed automatically to preserve performance with things like `List.filter`
     * that do not modify individual elements.
     *
     * @param list An array of input elements produced by previous pipe or by Action scope.
     * @param ctx Action runtime context.
     */
    abstract async apply(list: Element[], ctx: RuntimeCtx): Promise<Element[]>;

    /**
     * Entity type, used for reflection.
     * @public
     */
    get $entityType() { return 'pipe'; }

    /**
     * Pipe `$type` is used to link a JSON spec to pipe implementation (class).
     * {@link ResolverService} keeps a mapping from `$type` to PipeClass for
     * all core and extension modules.
     * @public
     */
    get type(): string { return this.$class.$type; }

    /**
     * A typed reference to pipe constructor.
     * @internal
     */
    get $class() { return this.constructor as PipeClass; }

    /**
     * An index of this pipe among its siblings.
     * @public
     */
    get $index(): number { return this.$owner.indexOf(this); }

    /**
     * @internal
     */
    get $key(): string { return `items/${this.$index}`; }

    /**
     * A reference to {@link Action} enclosing this pipe.
     * @public
     */
    get $action(): Action { return this.$owner.$action; }

    /**
     * Deserializes an instance from an arbitrary JSON object.
     *
     * @param spec
     * @internal
     */
    init(spec: any = {}) {
        const { id = uuid.v4(), enabled = true, label = '', notes = '' } = spec;
        this.id = id;
        this.enabled = enabled;
        this.label = label;
        this.notes = notes;
        this.readParams(spec);
    }

    /**
     * The depth of this pipe in pipeline hierarchy.
     *
     * 0 refers to top-level pipe, 1 to single-level nested pipe and so on.
     * @public
     */
    getDepth(): number {
        return this.$owner.getDepth();
    }

    /**
     * Returns previous sibling of this pipe, or `null` if it's the first pipe in pipeline.
     * @public
     */
    getPreviousPipe(): Pipe | null {
        return this.$owner.previousSibling(this);
    }

    /**
     * Returns next sibling of this pipe, or `null` if it's the last pipe in pipeline.
     * @public
     */
    getNextPipe(): Pipe | null {
        return this.$owner.nextSibling(this);
    }

    /**
     * For nested pipes, returns its nearest enclosing pipe. For top-level pipes returns `null`.
     * @public
     */
    getParentPipe(): Pipe | null {
        return this.$owner.$owner instanceof Pipe ? this.$owner.$owner : null;
    }

    /**
     * Traverses all pipeline parameters of this pipe.
     * @internal
     */
    *collectPipelines(): IterableIterator<Pipeline> {
        for (const param of this.getParams()) {
            if (param.type === 'pipeline') {
                yield (this as any)[param.name];
            }
        }
    }

    /**
     * Traverses a chain of ancestor pipes, from this pipe's parent upward.
     * @internal
     */
    *ancestorPipes(): IterableIterator<Pipe> {
        const parent = this.getParentPipe();
        if (parent) {
            yield parent;
            yield* parent.ancestorPipes();
        }
    }

    /**
     * An utility function that performs a flat map over the array of elements
     * and returns another array of elements.
     *
     * The callback is invoked for each element of `list`, the result is computed based on the result of callback:
     *
     * - `null` means the element is discarded (filtered away)
     * - single `Element` replaces the current element (like in regular `Array.map`)
     * - array of `Element` replaces the current element with all the elements of the produced array
     *   (like in regular `Array.flatMap`)
     *
     * The callback can be either synchronous or asynchronous (the Promise will be resolved and used as a result,
     * with the same rules applied).
     *
     * @param list Elements to map over.
     * @param mapFn Callback with `el: Element, index: number` arguments, producing new element/elements,
     *  either synchronously or asynchronously.
     * @public
     */
    async map(list: Element[], mapFn: MapFn): Promise<Element[]> {
        const result: Element[] = [];
        for (const el of list) {
            const res = await mapFn(el);
            if (res == null) {
                continue;
            }
            const newEls = Array.isArray(res) ? res : [res];
            for (const newEl of newEls) {
                util.assertPlayback(newEl instanceof Element, 'Pipes should return Element instances');
                result.push(newEl);
            }
        }
        return result;
    }

}

/**
 * Pipes whose `$type` cannot be translated into action class
 * are marked as `unresolved`.
 *
 * @internal
 */
export class UnresolvedPipe extends Pipe {
    static $type = 'unresolved';
    static $hidden = true;

    $originalSpec: any = null;

    init(spec: any = {}) {
        super.init(spec);
        this.$originalSpec = spec;
    }

    toJSON() {
        // The original spec is preserved on serialization
        return this.$originalSpec;
    }

    async apply(): Promise<Element[]> {
        const { type } = this.$originalSpec || {};
        throw util.scriptError(`Cannot run unresolved pipe: ${type}`);
    }
}

/**
 * @public
 */
type MapFn = (el: Element) => Promise<Element | Element[] | null> | Element | Element[] | null;
