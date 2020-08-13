import { runtime } from '../../runtime';
import assert from 'assert';

describe('StatsService', () => {
    it('collects origins', async () => {
        await runtime.goto('/index.html');
        await runtime.goto('/click.html');
        assert.deepEqual(runtime.$stats.visitedOrigins, ['http://localhost:3007']);
    });

    it('collects number of http requests', async () => {
        await runtime.goto('/index.html');
        assert.equal(runtime.$stats.httpRequestsCount, 2);
    });
});
