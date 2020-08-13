import Koa from 'koa';
import serveStatic from 'koa-static';
import bodyParser from 'koa-bodyparser';
import { apiRouter } from './api';

const server = new Koa();

export { server };

server.use(bodyParser());

server.use(async (ctx, next) => {
    const delay = Number(ctx.query.delay);
    const status = Number(ctx.query.status);
    const cookies = String(ctx.query.cookies);
    if (delay) {
        await new Promise(r => setTimeout(r, delay));
    }
    if (status) {
        ctx.status = status;
    }
    if (cookies) {
        const [name, value] = cookies.split(':');
        ctx.cookies.set(name, value, { maxAge: 3600 * 1000, httpOnly: false });
    }
    await next();
});

server.use(apiRouter.routes());
server.use(serveStatic(`${process.cwd()}/src/test/assets`));

server.listen(3007).on('error', err => {
    // eslint-disable-next-line no-console
    console.warn(err.message);
});
