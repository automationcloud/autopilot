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

import { runtime } from '../../runtime';
import assert from 'assert';

describe('Page.inputFile', () => {
    it('uploads a file to server', async () => {
        await runtime.goto('/input-file.html');
        const script = createScript();
        await script.runAll();
        await new Promise(r => setTimeout(r, 300));
        await runtime.page.waitForLoad();
        const body = await runtime.page.querySelector('body');
        const { text } = await body!.getInfo();
        const data = JSON.parse(text);
        assert.ok(data.stat);
        assert.ok(data.file);
        assert.equal(data.text.trim(), 'Hello, World!');
        assert.equal(data.field, 'Hello');
    });
});

function createScript() {
    return runtime.createScriptWithActions([
        {
            type: 'Page.fetch',
            responseBodyFormat: 'blob',
            pipeline: {
                pipes: [
                    {
                        type: 'Value.getJson',
                        value: JSON.stringify({
                            method: 'get',
                            url: runtime.getUrl('/hello.txt'),
                        }),
                    },
                ],
            },
            children: [
                {
                    type: 'Page.inputFile',
                    pipeline: {
                        pipes: [
                            {
                                type: 'DOM.queryOne',
                                selector: 'input[type="file"]',
                            },
                            {
                                type: 'Object.getPath',
                                path: '/response/body',
                            },
                        ],
                    },
                },
            ],
        },
        {
            type: 'Page.input',
            pipeline: {
                pipes: [
                    {
                        type: 'DOM.queryOne',
                        selector: 'input[type="text"]',
                    },
                    {
                        type: 'Value.getJson',
                        value: JSON.stringify('Hello'),
                    },
                ],
            },
        },
        {
            type: 'Page.click',
            pipeline: {
                pipes: [
                    {
                        type: 'DOM.queryOne',
                        selector: 'button[type="submit"]',
                    },
                ],
            },
        },
    ]);
}
