import { ChromeLauncher } from '../main/launcher';
import assert from 'assert';
import path from 'path';
import { TestRuntime } from './runtime';

const chromePort = Number(process.env.CHROME_PORT) || 9123;
const chromePath = process.env.CHROME_PATH || undefined;
const chromeHeadless = process.env.CHROME_HEADLESS === 'true';

export { assert };

export const runtime = new TestRuntime();

export const launcher = new ChromeLauncher({
    chromePort,
    chromePath,
    userDataDir: path.resolve(process.cwd(), '.tmp/chromedata'),
    additionalArgs: ['--site-per-process', chromeHeadless ? '--headless' : null],
});

export async function assertError(code: string, asyncFn: () => any): Promise<Error> {
    try {
        await asyncFn();
        throw new UnexpectedSuccessError();
    } catch (err) {
        assert.equal(err.code, code);
        return err;
    }
}

class UnexpectedSuccessError extends Error {
    code: string = 'UnexpectedSuccess';
}
