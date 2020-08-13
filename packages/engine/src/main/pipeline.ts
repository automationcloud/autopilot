import uuid from 'uuid';
import * as util from './util';
import * as model from './model';
import { Action } from './action';
import { Pipe } from './pipe';
import { RuntimeCtx } from './runtime';
import { Element } from './element';
import { Script } from './script';
import { Context } from './context';
import { migratePipeSpec } from './migrations';
import { Unit } from './unit';
import { ResolverService } from './services';

/**
 * Encapsulates an array of pipes applied sequentially.
 *
 * Pipelines are used as action or pipe parameters to facilitate data manipulations
 * (e.g. obtaining DOM nodes to work with, requesting inputs, transforming values, etc.)
 *
 * @public
 */
export class Pipeline extends model.EntityList<Unit<any>, Pipe> {
    /**
     * Unique ID of this action instance.
     * Must be unique within a Script, across all entities
     * @public
     */
    id: string;

    /**
     * Constructs a new Pipeline instance from JSON `spec`.
     * @param $owner Either Action or Pipe.
     * @param key The property name where this pipeline is assigned.
     * @param spec JSON spec.
     * @internal
     */
    constructor($owner: Unit<any>, key: string, spec: any) {
        const items = Array.isArray(spec) ? spec : spec?.pipes || spec?.items || [];
        super($owner, key, items);
        this.id = uuid.v4();
    }

    /**
     * Entity type, used for reflection.
     * @public
     */
    get $entityType() { return 'pipeline'; }

    /**
     * {@link Action} instance enclosing this pipeline.
     * @public
     */
    get $action(): Action {
        return this.$owner instanceof Action ? this.$owner : this.$owner.$action;
    }

    /**
     * {@link Context} instance enclosing this pipeline.
     * @public
     */
    get $context(): Context { return this.$owner.$context; }

    /**
     * {@link Script} this pipeline belongs to.
     * @public
     */
    get $script(): Script { return this.$owner.$script; }

    /**
     * {@link Engine} this instance is connected to.
     * @public
     */
    get $engine() { return this.$script.$engine; }

    /**
     * {@link BrowserService} the script is connected to.
     * @public
     */
    get $browser() { return this.$script.$browser; }

    /**
     * {@link ResolverService} used to resolve pipe `$type` into {@link Pipe} class.
     * @internal
     */
    get $resolver() { return this.$engine.get(ResolverService); }

    /**
     * @internal
     */
    get $idDatabase() { return this.$script; }

    /**
     * Creates a {@link Pipe} instance from `spec`.
     * The spec must minimally contain `type` field for resolving a {@link Pipe} class.
     * @param spec JSON serialized pipe spec.
     */
    create(spec: any): Pipe {
        spec = migratePipeSpec(util.cloneWithoutIdsCollision(spec || {}, this.$script.$ids));
        const PipeClass = this.$resolver.getPipeClass(spec.type);
        const pipe = new PipeClass(this);
        pipe.init(spec);
        return pipe;
    }

    /**
     * The depth of this pipe in pipeline hierarchy.
     *
     * 0 refers to top-level pipe, 1 to single-level nested pipe and so on.
     * @public
     */
    getDepth(): number {
        if (this.$owner instanceof Pipe) {
            return this.$owner.getDepth() + 1;
        }
        return 0;
    }

    /**
     * Traverses all descended pipes in a depth-first order.
     * @public
     */
    *descendentPipes(): IterableIterator<Pipe> {
        for (const pipe of this.items) {
            yield pipe;
            for (const pipeline of pipe.collectPipelines()) {
                yield* pipeline.descendentPipes();
            }
        }
    }

    /**
     * Applies pipes sequentially to the lists of {@link Element} instances,
     * starting with initial `list`. The output of each pipe becomes an input
     * of the next pipe. The output of last pipe becomes the result.
     *
     * @param list Array of {@link Element}
     * @param ctx Action runtime context.
     *  Actions must construct the runtime context explicitly via {@link Action.createCtx}.
     *  In pipes `ctx` is available as a second parameter to {@link Pipe.apply}
     *  and can be passed here.
     */
    async selectAll(list: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        if (ctx.$introspectionResults) {
            ctx.$introspectionResults.push({
                pipelineId: this.id,
                inputSet: list,
            });
            ctx.$introspectionStats.pipelinesExecuted += 1;
        }
        ctx.$stack.push({ pipeline: this, locals: new Map() });
        let nextInputSet = list;
        for (const pipe of this.items) {
            const startedAt = Date.now();
            try {
                // Normal flow
                ctx.pipe = pipe;
                const thisInputSet = nextInputSet;
                const outputSet = pipe.enabled ? await pipe.apply(thisInputSet, ctx) : thisInputSet;
                nextInputSet = outputSet;
                // Autopilot/debugging flow: intermediary results are collected, nextInputSet can be overridden
                if (ctx.$introspectionEnabled) {
                    ctx.$introspectionStats.pipesExecuted += 1;
                    // Allow overriding output of the pipe with a single element for debugging (aka spotlight)
                    if (ctx.$introspectionSpotlight) {
                        const { pipeId, index } = ctx.$introspectionSpotlight;
                        if (pipeId === pipe.id) {
                            const el = outputSet[index];
                            nextInputSet = el ? [el] : outputSet;
                        }
                    }
                    ctx.$introspectionResults.push({
                        pipeId: pipe.id,
                        inputSet: thisInputSet,
                        outputSet,
                        nextInputSet,
                        error: null,
                        duration: Date.now() - startedAt,
                    });
                }
            } catch (error) {
                if (ctx.$introspectionResults) {
                    ctx.$introspectionResults.push({
                        pipeId: pipe.id,
                        inputSet: nextInputSet,
                        outputSet: null,
                        nextInputSet: null,
                        error,
                        duration: Date.now() - startedAt,
                    });
                }
                error.details = {
                    ...error.details,
                    pipeId: pipe.id,
                    pipeType: pipe.type,
                };
                throw error;
            }
        }
        ctx.$stack.pop();
        return nextInputSet;
    }

    /**
     * Applies pipes sequentially to the lists of {@link Element} instances,
     * starting with initial `list`. The output of each pipe becomes an input
     * of the next pipe. The output of last pipe becomes the result.
     *
     * This is similar to {@link Pipeline.selectAll} except that exactly one
     * element is expected in the final output list.
     *
     * @param list Array of {@link Element}
     * @param ctx Action runtime context.
     *  Actions must construct the runtime context explicitly via {@link Action.createCtx}.
     *  In pipes `ctx` is available as a second parameter to {@link Pipe.apply}
     *  and can be passed here.
     */
    async selectOne(inputSet: Element[], ctx: RuntimeCtx): Promise<Element> {
        const result = await this.selectOneOrNull(inputSet, ctx);
        if (result == null) {
            throw util.createError({
                code: 'NoResults',
                message: 'Expected at least one result, found none',
                retry: true,
            });
        }
        return result;
    }

    /**
     * Applies pipes sequentially to the lists of {@link Element} instances,
     * starting with initial `list`. The output of each pipe becomes an input
     * of the next pipe. The output of last pipe becomes the result.
     *
     * This is similar to {@link Pipeline.selectAll} except that the final result
     * is expected to contain no more than a single element. If final result
     * yields 0 elements, `null` is returned.
     *
     * @param list Array of {@link Element}
     * @param ctx Action runtime context.
     *  Actions must construct the runtime context explicitly via {@link Action.createCtx}.
     *  In pipes `ctx` is available as a second parameter to {@link Pipe.apply}
     *  and can be passed here.
     */
    async selectOneOrNull(inputSet: Element[], ctx: RuntimeCtx): Promise<Element | null> {
        const results = await this.selectAll(inputSet, ctx);
        switch (results.length) {
            case 0:
                return null;
            case 1:
                return results[0];
            default:
                throw util.createError({
                    code: 'AmbiguousResults',
                    message: 'Expected single result, found multiple',
                    retry: true,
                });
        }
    }
}
