import { runtime } from '../../runtime';
import assert from 'assert';

describe('Flow.while', () => {
    it('iterates whilst condition is true', async () => {
        await runtime.runActions([
            {
                type: 'Page.navigate',
                pipeline: {
                    pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/input.html') }],
                },
            },
            {
                type: 'Flow.while',
                pipeline: {
                    pipes: [
                        { type: 'DOM.queryOne', selector: 'input' },
                        { type: 'DOM.getValue' },
                        { type: 'Value.equalsText', text: '11111' },
                        { type: 'Boolean.not' },
                    ],
                },
                children: [
                    {
                        type: 'Page.input',
                        useClear: false,
                        checkAndRetry: false,
                        pipeline: {
                            pipes: [
                                { type: 'DOM.queryOne', selector: 'input' },
                                { type: 'Value.getConstant', value: '1' },
                            ],
                        },
                    },
                ],
            },
        ]);
        const input = await runtime.page.querySelector('input');
        const { value } = await input!.getInfo();
        assert.equal(value, '11111');
    });

    it('throws when iteration limit is exceeded', async () => {
        await runtime.goto('/input.html');
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runActions([
                {
                    type: 'Flow.while',
                    pipeline: {
                        pipes: [
                            { type: 'DOM.queryOne', selector: 'input' },
                            { type: 'DOM.getValue' },
                            { type: 'Value.equalsText', text: '11111' },
                            { type: 'Boolean.not' },
                        ],
                    },
                },
            ]);
        });
    });
});
