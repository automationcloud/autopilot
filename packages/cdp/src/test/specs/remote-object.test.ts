import { runtime, assert } from '../globals';

describe('RemoteObject', () => {
    describe('jsonValue', () => {
        it('resolves JSON value', async () => {
            await runtime.goto('/index.html');
            const obj = await runtime.page.evaluate(() => {
                return { foo: 1, bar: 2 };
            });
            const json = await obj.jsonValue();
            assert.deepEqual(json, { foo: 1, bar: 2 });
        });
    });

    describe('getOwnProperties', () => {
        it('returns own properties', async () => {
            await runtime.goto('/index.html');
            const obj = await runtime.page.evaluate(() => {
                return { foo: 1, bar: 2 };
            });
            const props = await obj.getOwnProperties();
            assert.equal(props.size, 2);
            assert.ok(props.get('foo'));
            assert.ok(props.get('bar'));
        });
    });
});
