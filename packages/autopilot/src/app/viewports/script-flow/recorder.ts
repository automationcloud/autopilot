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

import { RemoteElementInfo, util } from '@automationcloud/engine';

import { InspectController } from '../../controllers/inspect';
import { clipboard, helpers } from '../../util';
import { ScriptFlowViewport } from '.';

export class ActionRecorderController {
    viewport: ScriptFlowViewport;

    constructor(viewport: ScriptFlowViewport) {
        this.viewport = viewport;
    }

    get app() {
        return this.viewport.app;
    }

    get inspect() {
        return this.app.get(InspectController);
    }

    async recordAction(type: string): Promise<void> {
        this.app.ui.frequentItems.onActionCreate(type);
        switch (type) {
            // case 'matcher':
            // case 'Flow.expect':
            //     return await this.recordMatcher(type);
            // case 'Page.click':
            // case 'Page.hover':
            // case 'Page.input':
            // case 'Flow.find':
            //     return await this.recordSingleElAction(type);
            case 'Page.fetch':
                return await this.recordFetch(type);
            default:
                return await this.viewport.commands.createAction({ type });
        }
    }

    // Note: not used, kept for reference
    protected async recordMatcher(type: string) {
        const document = await this.app.browser.page.document();
        const res = await this.inspect.recordElement(document);
        const spec: any = {
            label: '',
            type,
            pipeline: {
                pipes: [],
            },
        };
        if (res) {
            const { element, selector } = res;
            const { text } = await element.getInfo();
            spec.pipeline.pipes.push({ type: 'DOM.queryOne', selector });
            if (text) {
                const words = util.capitalizeWords(text).split(/\s+/);
                spec.label = words.slice(0, 4).join(' ');
                spec.pipeline.pipes.push({ type: 'DOM.getText' });
                spec.pipeline.pipes.push({ type: 'Value.containsText', text });
            } else {
                spec.pipeline.pipes.push({ type: 'DOM.isVisible' });
            }
        }
        return await this.viewport.commands.createAction(spec);
    }

    // Note: unused, kept for reference
    protected async recordSingleElAction(type: string) {
        const document = await this.app.browser.page.document();
        const res = await this.inspect.recordElement(document);
        const spec: any = {
            type,
            pipeline: {
                pipes: [],
            },
        };
        if (res) {
            const { selector } = res;
            spec.pipeline.pipes.push({ type: 'DOM.queryOne', selector });
        }
        return await this.viewport.commands.createAction(spec);
    }

    async recordFetch(type: string) {
        const actionSpec: any = { type };
        let url = '';
        if (clipboard.getUrl()) {
            url = clipboard.readText().trim();
        }
        if (!url) {
            url = this.app.browser.page.mainFrame().url;
        }
        if (url) {
            const mappings = helpers.createComposeMappings({
                method: 'GET',
                url,
            });
            actionSpec.pipeline = {
                pipes: [{ type: 'Object.compose', mappings }],
            };
        }
        return await this.viewport.commands.createAction(actionSpec);
    }

    // Composed actions

    async recordComposedAction(inputKey: string, path: string = '') {
        const document = await this.app.browser.page.document();
        const res = await this.inspect.recordElement(document);
        const spec: any = {
            type: 'placeholder',
            label: [inputKey, ...path.split('/')].filter(Boolean).join('.'),
            pipeline: {
                pipes: [],
            },
        };
        if (res) {
            const { element, selector } = res;
            const info = await element.getInfo();
            const type = this.inferComposedActionType(info);
            spec.type = type;
            spec.pipeline.pipes.push({ type: 'DOM.queryOne', selector });
            if (type === 'click') {
                if (info.tagName === 'select') {
                    spec.pipeline.pipes.push({ type: 'DOM.queryAll', selector: 'option' });
                    spec.pipeline.pipes.push({ type: 'DOM.getText' });
                    spec.pipeline.pipes.push({
                        type: 'List.filter',
                        pipeline: {
                            pipes: [
                                {
                                    type: 'Value.equals',
                                    pipelineB: {
                                        pipes: [
                                            { type: 'Value.getInput', inputKey },
                                            { type: 'Object.getPath', path },
                                        ],
                                    },
                                },
                            ],
                        },
                    });
                }
            } else {
                spec.pipeline.pipes.push({ type: 'Value.getInput', inputKey });
                spec.pipeline.pipes.push({ type: 'Object.getPath', path });
            }
        }
        return await this.viewport.commands.createAction(spec);
    }

    inferComposedActionType(info: RemoteElementInfo): string {
        switch (info.tagName) {
            case 'input':
                if (['checkbox', 'radio'].includes(info.attributes.type)) {
                    return 'Page.click';
                }
                return 'Page.input';
            case 'select':
            default:
                return 'Page.click';
        }
    }
}
