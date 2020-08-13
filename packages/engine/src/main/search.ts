import { Script } from './script';
import { Context } from './context';
import { Action } from './action';
import { Pipe } from './pipe';

import * as util from './util';
import jsonPointer from 'jsonpointer';

export class ScriptSearch {
    script: Script;

    constructor(script: Script) {
        this.script = script;
    }

    *search(queries: ScriptSearchQuery[], options: ScriptSearchOptions = {}): IterableIterator<ScriptSearchResult> {
        const { returnPipes = true, removeDuplicates = true } = options;
        const emittedIds = new Set();
        for (const r of this.searchAll(queries, returnPipes)) {
            if (removeDuplicates) {
                if (emittedIds.has(r.id)) {
                    continue;
                }
                emittedIds.add(r.id);
            }
            yield r;
        }
    }

    *searchAll(queries: ScriptSearchQuery[], returnPipes: boolean): IterableIterator<ScriptSearchResult> {
        const contextQueries = queries.filter(q => q.type === 'context');
        const actionQueries = queries.filter(q => q.type === 'action');
        const pipeQueries = queries.filter(q => q.type === 'pipe');
        for (const context of this.script.contexts) {
            if (this.matches(context, contextQueries)) {
                yield context;
            }
            for (const action of context.descendentActions()) {
                if (this.matches(action, actionQueries)) {
                    yield action;
                    if (!returnPipes) {
                        continue;
                    }
                }
                for (const pipe of action.descendentPipes()) {
                    if (this.matches(pipe, pipeQueries)) {
                        if (returnPipes) {
                            yield pipe;
                        } else {
                            yield action;
                            break;
                        }
                    }
                }
            }
        }
    }

    matches(obj: any, query: ScriptSearchQuery | ScriptSearchQuery[]): boolean {
        if (Array.isArray(query)) {
            return query.some(q => this.matches(obj, q));
        }
        for (const [key, value] of Object.entries(query.props)) {
            if (!this.matchProp(obj, key, value)) {
                return false;
            }
        }
        return true;
    }

    matchProp(obj: any, k: string, v: any) {
        const actualValue = k.startsWith('/') ? jsonPointer.get(obj, k) : obj[k];
        switch (util.getType(v)) {
            case 'array':
                return v.some((v: any) => this.matchProp(obj, k, v));
            case 'string':
            case 'boolean':
            case 'number':
                return util.strEquals(actualValue, v);
            case 'object': {
                const { $regexp, $contains } = v;
                if ($regexp) {
                    return new RegExp($regexp).test(actualValue);
                }
                if ($contains) {
                    return util.strContains(actualValue, $contains);
                }
                return false;
            }
            case 'null':
                return actualValue == null;
            default:
                return false;
        }
    }
}

export type ScriptSearchResult = Context | Action | Pipe;

export interface ScriptSearchQuery {
    type: 'context' | 'action' | 'pipe';
    props: { [name: string]: any };
}

export interface ScriptSearchOptions {
    returnPipes?: boolean;
    removeDuplicates?: boolean;
}
