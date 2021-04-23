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

import { RuntimeCtx } from '../ctx';
import { Element } from '../element';
import { params } from '../model';
import { Pipe } from '../pipe';
import * as util from '../util';

interface ExtractProperty {
    key: string;
    selector: string;
    property: string;
}

export class DomBatchExtract extends Pipe {
    static $type = 'DOM.batchExtract';
    static $help = `
Extracts multiple DOM properties from element or its descendants designated by selector at once.

This pipe replaces a series of Set Path > Query One > Extract pipelines,
and is significantly more efficient.
`;

    @params.Recordset({
        singular: 'property',
        fields: [
            {
                name: 'key',
                type: 'string',
                value: '',
            },
            {
                name: 'selector',
                type: 'selector',
                value: '',
            },
            {
                name: 'property',
                type: 'enum',
                value: '',
                enum: [
                    '',
                    'text',
                    'innerText',
                    'textContent',
                    'childText',
                    'value',
                    'checked',
                    'disabled',
                    'attributes',
                    'classList',
                ],
            },
        ],
    })
    properties: ExtractProperty[] = [];

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const properties = this.properties;

        const results = [];
        // We must partition the inputSet by execution contexts!
        const partitions = util.partitionBy(inputSet, el => el.remote.executionContext.executionContextId);

        for (const partition of partitions) {
            if (!partition.length) {
                continue;
            }
            const executionContext = partition[0].remote.executionContext;
            const remotes = partition.map(_ => _.remote);
            const data = await executionContext.evaluateJson(
                (properties: ExtractProperty[], toolkitBinding: string, ...els: HTMLElement[]) => {
                    const toolkit: any = (window as any)[toolkitBinding];
                    const results = [];
                    for (const el of els) {
                        const res: any = {};
                        for (const prop of properties) {
                            const subEl = prop.selector ? el.querySelector(prop.selector) : el;
                            if (subEl) {
                                const info = toolkit.getElementInfo(subEl);
                                const data = prop.property ? info[prop.property] : info;
                                res[prop.key] = data;
                            } else {
                                res[prop.key] = null;
                            }
                        }
                        results.push(res);
                    }
                    return results;
                },
                properties,
                executionContext.page.toolkitBinding,
                ...remotes,
            );
            for (let i = 0; i < partition.length; i++) {
                const el = partition[i];
                const extractedData = util.convertObjectPointers(data[i]);
                const newData =
                    util.getType(el.value) === 'object' ? Object.assign({}, el.value, extractedData) : extractedData;
                const newEl = el.clone(newData);
                results.push(newEl);
            }
        }
        return results;
    }
}
