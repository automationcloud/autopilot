# Chrome DevTools Protocol Driver

See [Chrome DevTools Protocol Viewer](https://chromedevtools.github.io/devtools-protocol/tot/) for all the awesome things you can do with your browser.

## Installation

```bash
npm install --save @automationcloud/cdp
```

## Usage

### Launch Chrome/Chromium browser

```ts
import { ChromeLauncher } from '@automationcloud/cdp';

export const launcher = new ChromeLauncher({
    chromePort: 9123,
    chromePath: '/Applications/Chromium 72.app/Contents/MacOS/Chromium',
    userDataDir: '.tmp/chromedata',
    additionalArgs: [
        '--site-per-process',
        // add more chrome CLI args here, e.g. --proxy-server or --headless
    ],
});

// Launch chrome
await launcher.launch();

// Graceful shutdown (wait till Chrome process exits)
await launcher.shutdown();

// ... or just send SIGTERM to it
launcher.stop();
```

### Connect to browser via CDP

```ts
import { Browser } from '@automationcloud/cdp';

const browser = new Browser({
    chromePort: 9123,
});

await browser.connect();
const tab = await browser.newTab();
await tab.navigate('https://github.com');
const h1 = await tab.querySelector('h1');
const { text } = await h1.getInfo();
// Built for developers
```

## Running tests

-   Copy `.env.example` to `.env`.
-   Specify environment variables (notably, the path to Chromium browser)
-   Note: you should not use your regular browser for testing, install a separate one which you don't normally use.
-   Note: make sure you don't have test browser running before running the tests.
-   Run `npm run dev` in separate terminal for incremental TypeScript compilation (in case you want to iterate on the tests or source code).
-   Run `npm test`.
