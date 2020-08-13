import { launcher, runtime } from './globals';

import './server';

before(async () => {
    await launcher.launch();
    await runtime.browser.connect();
});

after(async () => {
    await runtime.browser.close();
});

beforeEach(async () => {
    await runtime.openNewTab();
});

afterEach(async () => {
    await runtime.closeTab();
});
