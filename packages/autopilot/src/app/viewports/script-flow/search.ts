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

import { ScriptFlowViewport } from '.';
import { ScriptSearchQuery, ScriptSearchResult, Context, Action } from '@automationcloud/engine';
import { helpers } from '../../util';

export interface SearchCriterion {
    type: 'label' | 'action' | 'input' | 'errorCode' | 'resolve 3dsecure';
    value: string;
    contains?: boolean;
    score: number;
}

export class ScriptSearchController {
    viewport: ScriptFlowViewport;

    shown: boolean = false;
    criteria: SearchCriterion[] = [];
    results: Array<Context | Action> = [];
    currentResultIdx: number = 0;

    constructor(viewport: ScriptFlowViewport) {
        this.viewport = viewport;
    }

    get app() {
        return this.viewport.app;
    }

    isResultHighlighted(node: ScriptSearchResult) {
        return this.shown && this.results.some(r => r.id === node.id);
    }

    addCriterion(crit: SearchCriterion) {
        this.criteria.push(crit);
        this.performSearch();
    }

    removeCriterion(idx: number) {
        this.criteria.splice(idx, 1);
        this.performSearch();
    }

    performSearch() {
        this.results = [];
        this.currentResultIdx = 0;
        if (!this.criteria.length) {
            return;
        }
        const q = this.compileQuery();
        const script = this.viewport.app.project.script;
        this.results = Array.from(script.search(q, { returnPipes: false })) as Array<Context | Action>;
    }

    compileQuery(): ScriptSearchQuery[] {
        const queries: ScriptSearchQuery[] = [];
        const actionCrits = this.criteria.filter(_ => _.type === 'action');
        const labelCrits = this.criteria.filter(_ => _.type === 'label');
        const inputCrits = this.criteria.filter(_ => _.type === 'input');
        const errCodeCrits = this.criteria.filter(_ => _.type === 'errorCode');
        const resolve3dsCrits = this.criteria.filter(_ => _.type === 'resolve 3dsecure');
        if (actionCrits) {
            const type = this.criteriaToProp(actionCrits);
            queries.push({ type: 'action', props: { type } });
        }
        if (labelCrits.length) {
            const label = this.criteriaToProp(labelCrits);
            queries.push({ type: 'action', props: { label } });
            queries.push({ type: 'context', props: { name: label } });
        }
        if (inputCrits.length) {
            const inputKey = this.criteriaToProp(inputCrits);
            queries.push({ type: 'pipe', props: { inputKey } });
        }
        if (errCodeCrits.length) {
            const errorCode = this.criteriaToProp(errCodeCrits);
            queries.push({
                type: 'action',
                props: {
                    type: ['fail', 'expect'],
                    errorCode,
                },
            });
            queries.push({
                type: 'pipe',
                props: {
                    type: ['other/assert-exists'],
                    errorCode,
                },
            });
            queries.push({ type: 'context', props: { errorCode } });
        }
        if (resolve3dsCrits.length) {
            queries.push({ type: 'context', props: { resolve3dsecure: true } });
        }

        return queries;
    }

    criteriaToProp(criteria: SearchCriterion[]) {
        return criteria.map(crit => {
            return crit.contains ? { $contains: crit.value } : crit.value;
        });
    }

    getSuggestions(text: string): SearchCriterion[] {
        const q = text.trim();
        if (!q) {
            return [];
        }
        const suggestions: SearchCriterion[] = [
            { type: 'label', value: q, contains: true, score: 1000 },
            { type: 'input', value: q, contains: true, score: 1000 },
            { type: 'errorCode', value: q, contains: true, score: 1000 },
        ];
        for (const type of this.getActionTypes()) {
            const score = helpers.biasedFuzzyMatch(q, type);
            if (score > -1) {
                suggestions.push({ type: 'action', value: type, score });
            }
        }
        for (const inputKey of this.app.protocol.getInputKeys()) {
            const score = helpers.biasedFuzzyMatch(q, inputKey);
            if (score > -1) {
                suggestions.push({ type: 'input', value: inputKey, score });
            }
        }
        for (const code of this.app.protocol.getErrorCodeSuggestions()) {
            const score = helpers.biasedFuzzyMatch(q, code);
            if (score > -1) {
                suggestions.push({ type: 'errorCode', value: code, score });
            }
        }

        const score = helpers.biasedFuzzyMatch(q, '3dsecure resolve context');
        if (score > 1) {
            suggestions.push({ type: 'resolve 3dsecure', value: '', score: 1000 });
        }
        return suggestions.sort((a, b) => b.score - a.score);
    }

    getActionTypes() {
        const actionClasses = [...this.app.resolver.getActionIndex().values()];
        return actionClasses.map(_ => _.$type).sort();
    }

    activate() {
        this.shown = true;
        setTimeout(() => {
            const el = document.querySelector('.script-search__input') as HTMLElement;
            if (el) {
                el.focus();
            }
        }, 10);
    }

    selectCurrentResult() {
        const result = this.results[this.currentResultIdx];
        if (!result) {
            return;
        }
        this.viewport.selectItem(result);
        this.viewport.revealSelected();
    }

    nextResult() {
        this.activate();
        this.currentResultIdx = this.results.length ? (this.currentResultIdx + 1) % this.results.length : 0;
        this.selectCurrentResult();
    }

    previousResult() {
        this.activate();
        this.currentResultIdx = this.results.length
            ? (this.currentResultIdx - 1 + this.results.length) % this.results.length
            : 0;
        this.selectCurrentResult();
    }
}
