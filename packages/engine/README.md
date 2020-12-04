# Automation Engine

Engine powers Automation scripts model and execution.

## Quick Start Guide

This section describes the easiest way to run a script created in Autopilot using high-level abstraction called `LocalRobot`.

The code looks roughly as follows:

```ts
import { LocalRobot } from '@automationcloud/engine';

// Robot instance is initialized asynchronously
const robot = await Robot.create({
    script: '/path/to/my/script.json',
    chromePath: '/path/to/chromium/executable',
});

// Run the script and remember promise so we can wait till it finishes
const finish = robot.run({
    url: 'https://store-to-scrape.com',
    // other inputs ...
});

// Wait for outputs emitted by script
const [products, deliveryOptions] = await job.waitForOutputs('products', 'deliveryOptions');

// Wait until script finishes successfully
await finish;
```

Please refer to [source docs](src/main/robot/local-robot.ts) for more info.

### Chrome Setup

Local setup requires [Chromium](https://www.chromium.org/) executable to be available, so that the Robot can launch it with appropriate CLI flags (the most notable one is `--remote-debugging-port` which allows connecting to Chromium via Chrome DevTools Protocol).

**Note:** It is strongly recommended to avoid using your regular Chrome browser for performing automations. Doing so may cause data loss (Engine automatically cleans up browsing data to avoid polluted state) and may otherwise compromise your browsing data due to using unsafe CLI arguments. Additionally, your automation scripts will assume full control over browser lifecycle, which is simply not convenient.

Use the links from [Chrome Image Repo](https://github.com/automationcloud/chrome-image) to obtain the latest supported version of Chromium. Or, if you feel adventurous, just download a snapshot you prefer from https://commondatastorage.googleapis.com/chromium-browser-snapshots.
