import { runtime, assert } from '../globals';

describe('ScreenshotManager', () => {
    describe('captureViewport', () => {
        it('captures entire viewport page', async () => {
            await runtime.goto('/index.html');
            const scr = await runtime.page.screenshotManager.captureViewport();
            assert(scr.height > 0);
            assert(scr.width > 0);
            assert(scr.imageData.length > 0);
        });
    });

    describe('captureElement', () => {
        it('captures element', async () => {
            await runtime.goto('/buttons.html');
            const el = await runtime.page.querySelector('button');
            const scr = await runtime.page.screenshotManager.captureElement(el!, {
                format: 'jpeg',
                quality: 80,
            });
            // fs.writeFileSync('1.jpg', scr.imageData, 'base64');
            assert(scr.height > 0);
            assert(scr.width > 0);
            assert(scr.imageData.length > 0);
        });
    });
});
