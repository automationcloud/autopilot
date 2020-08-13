import { runtime, assert } from '../globals';

describe('Misc', () => {
    it('does not send Do-Not-Track', async () => {
        await runtime.goto('/headers');
        const body = await runtime.page.evaluateJson(() => document.documentElement!.innerText);
        const headers = JSON.parse(body);
        assert(headers['dnt'] == null);
    });
});
