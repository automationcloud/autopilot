import { runtime, assert, assertError } from '../globals';

import { RemoteElement } from '../../main/remote-element';
import { RemoteObject } from '../../main/remote-object';

describe('ExecutionContext', () => {
    describe('evaluate', () => {
        it('evaluates document as RemoteElement', async () => {
            await runtime.goto('/index.html');
            const ex = await runtime.page.mainFrame().getDefaultExecutionContext();
            const res = await ex.evaluate(() => document);
            assert(res instanceof RemoteElement);
        });

        it('evaluates async functions', async () => {
            const ex = await runtime.page.mainFrame().getDefaultExecutionContext();
            const res = await ex.evaluate(async () => {
                await new Promise(r => setTimeout(r, 100));
            });
            assert(res instanceof RemoteObject);
        });

        it('provides on-page exceptions', async () => {
            const ex = await runtime.page.mainFrame().getDefaultExecutionContext();
            const err = await assertError('EvaluateFailed', async () => {
                await ex.evaluate(() => {
                    throw new Error('Some error message');
                });
            });
            assert(err.message.includes('Some error message'));
        });
    });
});
