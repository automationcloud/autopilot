import Router from 'koa-router2';
import fs from 'fs';
import path from 'path';
import util from 'util';
import Json5 from 'json5';
import uuid = require('uuid');
import { WorkerBaseApp } from '../../main';
import { RedisProvider } from '../../main/services/redis';

const readFile = util.promisify(fs.readFile);

export const apiRouter = new Router();
const router = apiRouter;

const executionsDb: Map<string, any> = new Map();
const checkpointsDb: Map<string, any> = new Map();

const app = new WorkerBaseApp();
const redisProvider = app.container.get(RedisProvider);
const redis = redisProvider.createClient();

async function getScript(name: string) {
    const file = path.resolve(process.cwd(), 'src/test/scripts', `${name}.json5`);
    const text = await readFile(file, 'utf8');
    return Json5.parse(text);
}

router.post('/api/~/executions', ctx => {
    const { id, serviceId, input, options, ip, proxyId, checkpointId = null } = ctx.request.body as any;
    const execution = {
        id,
        serviceId,
        scriptId: serviceId,
        jobId: serviceId,
        state: 'created',
        input,
        ip,
        proxyId,
        output: {},
        error: null,
        options: Object.assign(
            {
                htmlSnapshot: false,
                screenshot: false,
                pauseOnSuccess: false,
            },
            options,
        ),
        $events: [],
        $inputsRequested: [],
        checkpointId,
        $checkpoints: [],
    };
    executionsDb.set(id, execution);
    ctx.body = execution;
});

router.post('/api/private/executions', ctx => {
    // Test-only shortcut: jobId === executionId
    const { jobId } = ctx.request.body as any;
    const execution = executionsDb.get(jobId);
    ctx.body = execution;
});

router.use('/api/private/executions/:id', async (ctx, next) => {
    const { id } = (ctx as any).params;
    const execution = executionsDb.get(id);
    if (!execution) {
        return ctx.throw(404);
    }
    ctx.state.execution = execution;
    return await next();
});

router.get('/api/private/executions/:id', ctx => {
    ctx.body = ctx.state.execution;
});

router.post('/api/private/executions/:id/request-input', ctx => {
    // Here's a trick: we'll send No Content first to emulate "waiting for" behavior
    // then, we'll start answering immediately
    const { execution } = ctx.state;
    const { key, stage = '' } = ctx.request.body as any;
    // Note: stages not yet supported
    const data = execution.input[key];
    if (execution.$inputsRequested.includes(key)) {
        ctx.body = {
            key,
            stage,
            data,
        };
    } else {
        redis.lpush(
            `executions:${execution.id}:signals`,
            JSON.stringify({
                name: 'job-input-create',
                data: {
                    key,
                    stage,
                    data,
                },
            }),
        );
        execution.$inputsRequested.push(key);
        ctx.status = 204;
        return;
    }
});

router.post('/api/private/executions/:id/outputs', ctx => {
    const { key, data } = ctx.request.body as any;
    const { execution } = ctx.state;
    execution.output[key] = data;
    ctx.body = {
        key,
        data,
    };
});

// deprecated, no longer used
router.get('/api/private/executions/:id/script', async ctx => {
    const { serviceId } = ctx.state.execution;
    const script = await getScript(serviceId);
    ctx.body = {
        script,
    };
});

router.put('/api/private/executions/:id', ctx => {
    const { state, workerId, workerEngineVersion } = ctx.request.body as any;
    Object.assign(ctx.state.execution, {
        state,
        workerId,
        workerEngineVersion,
    });
    ctx.body = ctx.state.execution;
});

router.post('/api/private/executions/:id/errors', ctx => {
    const { name, code, message, details, stack } = ctx.request.body as any;
    ctx.state.execution.error = { name, code, message, details, stack };
    ctx.body = ctx.state.execution;
});

router.post('/api/private/executions/:id/fail', ctx => {
    const { error, workerId, workerEngineVersion } = ctx.request.body as any;
    Object.assign(ctx.state.execution, { error, workerId, workerEngineVersion });
    ctx.state.execution.state = 'fail';
    ctx.body = ctx.state.execution;
});

router.get('/api/private/scripts/:id/content', async ctx => {
    const { id } = (ctx as any).params;
    const script = await getScript(id);
    ctx.body = {
        script,
    };
});

router.post('/api/private/execution-events', ctx => {
    const { executionId, workerId, namespace, name, details, action, context } = ctx.request.body as any;
    const execution = executionsDb.get(executionId);
    execution.$events.push({
        workerId,
        namespace,
        name,
        details,
        action,
        context,
    });
    ctx.body = {};
});

router.get('/api/Proxy/get', ctx => {
    const { id } = ctx.query;
    const proxy: any = {
        id,
        connection: {
            hostname: 'someOtherRoxiHostName',
            port: 6745,
            authScheme: 'basic',
            username: 'testUsername',
            password: 'pa$$word',
        },
    };
    if (id === 'basicUsernameNull') {
        proxy.connection.username = null;
    }
    if (id === 'basicPasswordNull') {
        proxy.connection.password = null;
    }
    ctx.body = proxy;
});

router.post('/api/private/screenshots', ctx => {
    ctx.body = {};
});

router.post('/api/private/html-snapshots', ctx => {
    ctx.body = {};
});

router.post('/api/private/checkpoints', ctx => {
    const { executionId, url, title, data, consumedInputKeys } = ctx.request.body as any;
    const execution = executionsDb.get(executionId);
    if (!execution) {
        return ctx.throw(404);
    }
    const checkpoint = {
        id: uuid.v4(),
        executionId,
        url,
        title,
        data,
        consumedInputKeys,
    };
    checkpointsDb.set(checkpoint.id, checkpoint);
    execution.checkpointId = checkpoint.id;
    execution.$checkpoints.push(checkpoint);
    ctx.body = checkpoint;
});

router.get('/api/private/checkpoints/:id', ctx => {
    const { id } = (ctx as any).params;
    const checkpoint = checkpointsDb.get(id);
    if (!checkpoint) {
        return ctx.throw(404);
    }
    ctx.body = checkpoint;
});

router.post('/api/token', ctx => {
    const {
        grant_type: grantType,
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
    } = ctx.request.body as any;

    if (!grantType || !clientId || !clientSecret) {
        return ctx.throw(400);
    }

    if (grantType === 'refresh_token' && !refreshToken) {
        return ctx.throw(400);
    }

    const response = {
        'access_token': uuid.v4(),
        'expires_in': 60,
        'refresh_token': uuid.v4(),
    };
    ctx.body = response;
});
