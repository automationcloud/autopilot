import { runtime, assert, assertError } from '../globals';

import { RemoteElement } from '../../main/remote-element';

describe('RemoteElement', () => {
    describe('querySelectorAll', () => {
        it('returns an array of elements', async () => {
            await runtime.goto('/buttons.html');
            const document = await runtime.page.document();
            const buttons = await document.querySelectorAll('button');
            assert.equal(buttons.length, 4);
            for (const button of buttons) {
                assert(button instanceof RemoteElement);
                assert.equal(button.description, 'button');
            }
        });
    });

    describe('querySelector', () => {
        it('returns an element by selector', async () => {
            await runtime.goto('/index.html');
            const document = await runtime.page.document();
            const h1 = await document.querySelector('h1');
            assert(h1 instanceof RemoteElement);
            assert.equal(h1!.description, 'h1#hello');
        });

        it('returns null if element not found', async () => {
            await runtime.goto('/index.html');
            const document = await runtime.page.document();
            const h6 = await document.querySelector('h6');
            assert.equal(h6, null);
        });
    });

    describe('queryXpathAll', () => {
        it('returns an array of elements', async () => {
            await runtime.goto('/buttons.html');
            const document = await runtime.page.document();
            const buttons = await document.queryXPathAll('//button');
            assert.equal(buttons.length, 4);
            for (const button of buttons) {
                assert(button instanceof RemoteElement);
                assert.equal(button.description, 'button');
            }
        });

        it('filters out non element result', async () => {
            await runtime.goto('/buttons.html');
            const document = await runtime.page.document();
            const span = await document.queryXPathAll('//span[@class]');
            assert.equal(span.length, 1);
            const attribute = await document.queryXPathAll('//span/@class');
            assert.equal(attribute.length, 0);
        });
    });

    describe('queryXpathOne', () => {
        it('returns an element', async () => {
            await runtime.goto('/buttons.html');
            const document = await runtime.page.document();
            const button = await document.queryXPathOne('//button');
            assert(button instanceof RemoteElement);
        });

        it('returns null if non element instance is selected', async () => {
            await runtime.goto('/buttons.html');
            const document = await runtime.page.document();
            const span = await document.queryXPathOne('//span[@class]');
            assert(span);
            const attribute = await document.queryXPathOne('//span/@class');
            assert.equal(attribute, null);
        });
    });
    describe('describeNode', () => {
        it('returns node information', async () => {
            await runtime.goto('/index.html');
            const h1 = await runtime.page.querySelector('h1');
            const info = await h1!.describeNode();
            assert.equal(info.nodeName, 'H1');
            assert.deepEqual(info.attributes, ['id', 'hello']);
        });
    });

    describe('click', () => {
        it('clicks element', async () => {
            await runtime.goto('/click.html');
            const el = await runtime.page.querySelector('button');
            await el!.click();
            // Observe page changes
            const submitted = await runtime.page.querySelector('.submitted');
            assert(submitted != null);
        });

        it('clicks element obscured by overlay', async () => {
            await runtime.goto('/click-overlay.html');
            const el = await runtime.page.querySelector('button');
            await el!.click();
            const submitted = await runtime.page.querySelector('.submitted');
            const { text } = await submitted!.getInfo();
            assert.equal(text, 'Submitted');
        });

        it('throws if element is not visible', async () => {
            await runtime.goto('/invisible.html');
            const button = await runtime.page.querySelector('a.invisible');
            await assertError('ElementNotVisible', async () => {
                await button!.click();
            });
        });

        it('produces correct sequence of events', async () => {
            await runtime.goto('/events/click.html');
            const button = await runtime.page.querySelector('button');
            await button!.click();
            const eventsEl = await runtime.page.querySelector('#events');
            const { text } = await eventsEl!.getInfo();
            assert.equal(text, 'pointerdown,mousedown,focus,focusin,pointerup,mouseup,click');
        });

        it('clicks options', async () => {
            await runtime.goto('/select.html');
            const opt = await runtime.page.querySelector('option:nth-child(2)');
            await opt!.click();
            const h1 = await runtime.page.querySelector('h1');
            const { text } = await h1!.getInfo();
            assert.equal(text, 'Your language is: Français');
        });

        it('clicks options even when no value is provided', async () => {
            await runtime.goto('/select-no-value.html');
            const opt = await runtime.page.querySelector('option[label="Português"]');
            await opt!.click();
            const h1 = await runtime.page.querySelector('h1');
            const { text } = await h1!.getInfo();
            assert.equal(text, 'Your language is: Português');
        });
    });

    describe('typeText', () => {
        it('types text into element', async () => {
            await runtime.goto('/input.html');
            const input = await runtime.page.querySelector('input');
            await input!.typeText('Adélaïde');
            const { value } = await input!.getInfo();
            assert.equal(value, 'Adélaïde');
            const h1 = await runtime.page.querySelector('h1');
            const { text } = await h1!.getInfo();
            assert.equal(text, 'Your name is: Adélaïde');
        });

        it('populates correct keys', async () => {
            await runtime.goto('/input.html');
            const el = await runtime.page.querySelector('input');
            await el!.typeText('Adélaïde');
            const evts = await runtime.page.evaluateJson(() => {
                const nodes = document.querySelectorAll('li strong');
                return [].map.call(nodes, (n: any) => n.innerText);
            });
            // await new Promise(r => setTimeout(r, 1000));
            assert.deepEqual(evts, ['8', '65', '68', '81', '76', '65', '81', '68', '69']);
        });

        it('produces correct events', async () => {
            await runtime.goto('/events/input.html');
            const el = await runtime.page.querySelector('input');
            await el!.typeText('hello');
            const eventsEl = await runtime.page.querySelector('#events');
            const { text } = await eventsEl!.getInfo();
            assert.equal(
                text,
                'pointerdown,mousedown,focus,focusin,pointerup,mouseup,click,' +
                'keydown,input,keyup,' + // Backspace
                'keydown,keypress,input,keyup,' + // h
                'keydown,keypress,input,keyup,' + // e
                'keydown,keypress,input,keyup,' + // l
                'keydown,keypress,input,keyup,' + // l
                'keydown,keypress,input,keyup,' + // o
                    'change,blur,focusout',
            );
        });
    });

    describe('ownerDocument', () => {
        it('returns owner document', async () => {
            await runtime.goto('/index.html');
            const document = await runtime.page.document();
            const h1 = await runtime.page.querySelector('h1');
            const ownerDocument = await h1!.ownerDocument();
            const sameEl = await document.isEqualTo(ownerDocument);
            assert(sameEl);
        });
    });
});
