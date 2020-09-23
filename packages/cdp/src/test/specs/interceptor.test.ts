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

import { runtime, assert } from '../globals';

describe('Interceptor', () => {
    const logs: Array<[string, string]> = [];

    beforeEach(() => {
        logs.splice(0, logs.length);
    });

    afterEach(() => runtime.browser.clearInterceptors());

    context('no outcomes specified', () => {
        beforeEach(() => {
            runtime.browser.interceptRequests(async req => {
                logs.push([req.request.url, 'i1']);
            });
            runtime.browser.interceptRequests(async req => {
                logs.push([req.request.url, 'i2']);
            });
            runtime.browser.interceptRequests(async req => {
                logs.push([req.request.url, 'i3']);
            });
        });

        it('intercepts and continues requests', async () => {
            await runtime.goto('/index.html');
            assert(logs.length > 0);
            const documentRequest = logs.find(_ => _[0].includes('/index.html'));
            assert.ok(documentRequest);
        });

        it('passes each request to next interceptors in chain', async () => {
            await runtime.goto('/index.html');
            const urls = new Set(logs.map(_ => _[0]));
            for (const url of urls) {
                const interceptorIds = logs.filter(_ => _[0] === url).map(_ => _[1]);
                assert.equal(interceptorIds.length, 3);
                assert.equal(interceptorIds.join(','), 'i1,i2,i3');
            }
        });
    });

    describe('fail', () => {
        beforeEach(() => {
            runtime.browser.interceptRequests(async req => {
                logs.push([req.request.url, 'i1']);
                return req.fail('AccessDenied');
            });
            runtime.browser.interceptRequests(async req => {
                logs.push([req.request.url, 'i2']);
            });
        });

        it('fails request with specified reason', async () => {
            try {
                await runtime.goto('/index.html');
                throw new Error('UnexpectedSuccess');
            } catch (err) {
                assert.equal(err.code, 'NavigationFailed');
                assert(err.message.includes('net::ERR_ACCESS_DENIED'));
            }
        });

        it('does not run next interceptors in chain', async () => {
            await runtime.goto('/index.html').catch(() => {});
            assert(logs.some(_ => _[1] === 'i1'));
            assert(!logs.some(_ => _[1] === 'i2'));
        });
    });

    describe('fulfill', () => {
        beforeEach(() => {
            runtime.browser.interceptRequests(async req => {
                logs.push([req.request.url, 'i1']);
                return req.fulfill({
                    responseCode: 200,
                    responseHeaders: {
                        'X-Foo': 'Hello',
                    },
                    body: '<h1>Intercepted!</h1>',
                });
            });
            runtime.browser.interceptRequests(async req => {
                logs.push([req.request.url, 'i2']);
            });
        });

        it('substitutes the response', async () => {
            await runtime.goto('/index.html');
            const h1 = await runtime.page.querySelector('h1');
            const { text } = await h1!.getInfo();
            assert.equal(text, 'Intercepted!');
            const rs = runtime.page.networkManager
                .getCollectedResources()
                .find(rs => rs.request.url.includes('/index.html'));
            assert.ok(rs);
            assert.equal(rs!.response!.headers['X-Foo'], 'Hello');
        });

        it('does not run next interceptors in chain', async () => {
            await runtime.goto('/index.html');
            assert(logs.some(_ => _[1] === 'i1'));
            assert(!logs.some(_ => _[1] === 'i2'));
        });
    });

    describe('continue', () => {
        describe('without modifications', () => {
            beforeEach(() => {
                runtime.browser.interceptRequests(async req => {
                    logs.push([req.request.url, 'i1']);
                    return req.continue();
                });
                runtime.browser.interceptRequests(async req => {
                    logs.push([req.request.url, 'i2']);
                });
            });

            it('continues request unmodified', async () => {
                await runtime.goto('/index.html');
                const h1 = await runtime.page.querySelector('h1');
                const { text } = await h1!.getInfo();
                assert.equal(text, 'Welcome!');
            });

            it('does not run next interceptors in chain', async () => {
                await runtime.goto('/index.html');
                assert(logs.some(_ => _[1] === 'i1'));
                assert(!logs.some(_ => _[1] === 'i2'));
            });
        });

        describe('with modifications', () => {

            it('rewrites the request', async () => {
                runtime.browser.interceptRequests(async req => {
                    logs.push([req.request.url, 'i1']);
                    return req.continue({
                        url: runtime.getUrl('/headers'),
                        headers: [
                            { name: 'X-Boo', value: 'Barr' },
                        ] as any
                    });
                });
                await runtime.goto('/index.html');
                const body = await runtime.page.querySelector('body');
                const { text } = await body!.getInfo();
                const json = JSON.parse(text);
                assert.equal(json['x-boo'], 'Barr');
                // Make sure the rewrite is not observed by page
                const href = await runtime.page.evaluateJson(() => location.href);
                assert.equal(href, runtime.getUrl('/index.html'));
            });

            it('adds extra headers', async () => {
                runtime.browser.interceptRequests(async req => {
                    return req.pass({
                        extraHeaders: { 'X-Foo': 'Farr' },
                    });
                });
                runtime.browser.interceptRequests(async req => {
                    return req.continue({
                        url: runtime.getUrl('/headers'),
                        extraHeaders: [
                            { name: 'X-Boo', value: 'Barr' },
                        ] as any
                    });
                });
                await runtime.goto('/index.html');
                const body = await runtime.page.querySelector('body');
                const { text } = await body!.getInfo();
                const json = JSON.parse(text);
                assert.equal(json['x-foo'], 'Farr');
                assert.equal(json['x-boo'], 'Barr');
                // Make sure the rewrite is not observed by page
                const href = await runtime.page.evaluateJson(() => location.href);
                assert.equal(href, runtime.getUrl('/index.html'));
            });

            it('does not run next interceptors in chain', async () => {
                runtime.browser.interceptRequests(async req => {
                    logs.push([req.request.url, 'i1']);
                    return req.continue();
                });
                runtime.browser.interceptRequests(async req => {
                    logs.push([req.request.url, 'i2']);
                });
                await runtime.goto('/index.html');
                assert(logs.some(_ => _[1] === 'i1'));
                assert(!logs.some(_ => _[1] === 'i2'));
            });
        });
    });

    describe('pass', () => {

        it('modifies request', async () => {
            runtime.browser.interceptRequests(async req => {
                return req.pass({
                    url: runtime.getUrl('/index-alt.html'),
                });
            });
            await runtime.goto('/index.html');
            const h1 = await runtime.page.querySelector('h1');
            const { text } = await h1!.getInfo();
            assert.equal(text, 'Hello World!');
            // Make sure the rewrite is not observed by page
            const href = await runtime.page.evaluateJson(() => location.href);
            assert.equal(href, runtime.getUrl('/index.html'));
        });

        it('adds extra headers', async () => {
            runtime.browser.interceptRequests(async req => {
                return req.pass({
                    extraHeaders: { 'X-Foo': 'Farr' },
                });
            });
            runtime.browser.interceptRequests(async req => {
                return req.pass({
                    extraHeaders: { 'X-Boo': 'Barr' }
                });
            });
            runtime.browser.interceptRequests(async req => {
                return req.pass({
                    url: runtime.getUrl('/headers'),
                });
            });
            await runtime.goto('/index.html');
            const body = await runtime.page.querySelector('body');
            const { text } = await body!.getInfo();
            const json = JSON.parse(text);
            assert.equal(json['x-foo'], 'Farr');
            assert.equal(json['x-boo'], 'Barr');
            // Make sure the rewrite is not observed by page
            const href = await runtime.page.evaluateJson(() => location.href);
            assert.equal(href, runtime.getUrl('/index.html'));
        });

        it('runs next interceptors in chain', async () => {
            runtime.browser.interceptRequests(async req => {
                logs.push([req.request.url, 'i1']);
                return req.pass();
            });
            runtime.browser.interceptRequests(async req => {
                logs.push([req.request.url, 'i2']);
            });
            await runtime.goto('/index.html');
            assert(logs.some(_ => _[1] === 'i1'));
            assert(logs.some(_ => _[1] === 'i2'));
        });
    });
});
