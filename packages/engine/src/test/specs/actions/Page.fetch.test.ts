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

import assert from 'assert';

import { runtime } from '../../runtime';

describe('Page.fetch', () => {
    context('Chrome page runtime (Fetch)', () => {
        it('sends POST with json payload', async () => {
            await runtime.goto('/index.html');
            await runtime.runActions([
                {
                    type: 'Page.fetch',
                    mode: 'Fetch',
                    requestBodyFormat: 'json',
                    responseBodyFormat: 'json',
                    pipeline: {
                        pipes: [
                            {
                                type: 'Value.getJson',
                                value: JSON.stringify({
                                    url: runtime.getUrl('/echo'),
                                    method: 'POST',
                                    body: { hello: 'world' },
                                }),
                            },
                        ],
                    },
                    children: [
                        {
                            type: 'Flow.output',
                            outputKey: 'result',
                        },
                    ],
                },
            ]);
            const output = runtime.flow.outputs.find(o => o.key === 'result')!;
            assert.ok(output);
            assert.equal(output.data.request.method, 'POST');
            assert.equal(output.data.request.url, runtime.getUrl('/echo'));
            assert.ok(output.data.request.headers);
            assert.ok(output.data.request.body);
            assert.equal(output.data.response.status, 200);
            assert.equal(output.data.response.statusText, 'OK');
            assert.ok(output.data.response.headers);
            assert.deepEqual(output.data.response.body, { hello: 'world' });
        });

        it('does not reject http errors when rejectHttpErrors: false', async () => {
            await runtime.goto('/index.html');
            await runtime.runActions([
                {
                    type: 'Page.fetch',
                    mode: 'Fetch',
                    requestBodyFormat: 'none',
                    responseBodyFormat: 'none',
                    rejectHttpErrors: false,
                    pipeline: {
                        pipes: [
                            {
                                type: 'Value.getJson',
                                value: JSON.stringify({
                                    url: runtime.getUrl('/error/403'),
                                    method: 'get',
                                }),
                            },
                        ],
                    },
                    children: [
                        {
                            type: 'Flow.output',
                            outputKey: 'result',
                        },
                    ],
                },
            ]);
            const output = runtime.flow.outputs.find(o => o.key === 'result')!;
            assert.ok(output);
            assert.equal(output.data.request.method, 'GET');
            assert.equal(output.data.request.url, runtime.getUrl('/error/403'));
            assert.equal(output.data.response.status, 403);
        });
    });

    context('Node.js runtime', () => {
        it('sends POST with json payload', async () => {
            await runtime.goto('/index.html');
            await runtime.runActions([
                {
                    type: 'Page.fetch',
                    mode: 'Node',
                    requestBodyFormat: 'json',
                    responseBodyFormat: 'json',
                    pipeline: {
                        pipes: [
                            {
                                type: 'Value.getJson',
                                value: JSON.stringify({
                                    url: runtime.getUrl('/echo'),
                                    method: 'POST',
                                    body: { hello: 'world' },
                                }),
                            },
                        ],
                    },
                    children: [
                        {
                            type: 'Flow.output',
                            outputKey: 'result',
                        },
                    ],
                },
            ]);
            const output = runtime.flow.outputs.find(o => o.key === 'result')!;
            assert.ok(output);
            assert.equal(output.data.request.method, 'POST');
            assert.equal(output.data.request.url, runtime.getUrl('/echo'));
            assert.ok(output.data.request.headers);
            assert.ok(output.data.request.body);
            assert.equal(output.data.response.status, 200);
            assert.equal(output.data.response.statusText, 'OK');
            assert.ok(output.data.response.headers);
            assert.deepEqual(output.data.response.body, { hello: 'world' });
        });

        it('parses specified encoding response body', async () => {
            await runtime.goto('/index.html');
            await runtime.runActions([
                {
                    type: 'Page.fetch',
                    mode: 'Node',
                    requestBodyFormat: 'none',
                    responseBodyFormat: 'text',
                    pipeline: {
                        pipes: [
                            {
                                type: 'Value.getJson',
                                value: JSON.stringify({
                                    url: runtime.getUrl('/headers'),
                                    method: 'GET',
                                    headers: {
                                        'content-type': 'text/plain;charset=ISO-8859-1',
                                        hello: 'SANT VICENÇ DE CALDERS',
                                    },
                                }),
                            },
                        ],
                    },
                    children: [
                        {
                            type: 'Flow.output',
                            outputKey: 'result',
                        },
                    ],
                },
            ]);
            const output = runtime.flow.outputs.find(o => o.key === 'result')!;
            assert.ok(output);
            assert.equal(output.data.request.method, 'GET');
            assert.equal(output.data.request.url, runtime.getUrl('/headers'));
            assert.ok(output.data.request.headers);
            assert.equal(output.data.response.status, 200);
            assert.equal(output.data.response.statusText, 'OK');
            assert.ok(output.data.response.headers);
            assert.ok(output.data.response.body.includes('VICENÇ'));

        });
    });
});
