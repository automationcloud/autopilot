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

    context('fail', () => {
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

    context('fulfill', () => {
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

    context('continue', () => {
        context('without modifications', () => {
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

        context('with modifications', () => {
            beforeEach(() => {
                runtime.browser.interceptRequests(async req => {
                    logs.push([req.request.url, 'i1']);
                    return req.continue({
                        url: runtime.getUrl('/headers'),
                        headers: [
                            { name: 'X-Boo', value: 'Barr' },
                        ] as any
                    });
                });
                runtime.browser.interceptRequests(async req => {
                    logs.push([req.request.url, 'i2']);
                });
            });

            it('rewrites the request', async () => {
                await runtime.goto('/index.html');
                const body = await runtime.page.querySelector('body');
                const { text } = await body!.getInfo();
                const json = JSON.parse(text);
                assert.equal(json['x-boo'], 'Barr');
                // Make sure the rewrite is not observed by page
                const href = await runtime.page.evaluateJson(() => location.href);
                assert.equal(href, runtime.getUrl('/index.html'));
            });

            it('does not run next interceptors in chain', async () => {
                await runtime.goto('/index.html');
                assert(logs.some(_ => _[1] === 'i1'));
                assert(!logs.some(_ => _[1] === 'i2'));
            });
        });
    });

    context('pass', () => {
        beforeEach(() => {
            runtime.browser.interceptRequests(async req => {
                logs.push([req.request.url, 'i1']);
                return req.pass({
                    url: runtime.getUrl('/index-alt.html'),
                });
            });
            runtime.browser.interceptRequests(async req => {
                logs.push([req.request.url, 'i2']);
            });
        });

        it('modifies request', async () => {
            await runtime.goto('/index.html');
            const h1 = await runtime.page.querySelector('h1');
            const { text } = await h1!.getInfo();
            assert.equal(text, 'Hello World!');
            // Make sure the rewrite is not observed by page
            const href = await runtime.page.evaluateJson(() => location.href);
            assert.equal(href, runtime.getUrl('/index.html'));
        });

        it('runs next interceptors in chain', async () => {
            await runtime.goto('/index.html');
            assert(logs.some(_ => _[1] === 'i1'));
            assert(logs.some(_ => _[1] === 'i2'));
        });
    });
});
