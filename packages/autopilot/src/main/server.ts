import http from 'http';
import { sendToAllWindows } from './windows';
import { AddressInfo } from 'net';

import Koa from 'koa';
import Router from 'koa-router2';
import bodyParser from 'koa-bodyparser';

export class ControlServer {
    app: Koa;
    server: http.Server;
    router: Router;

    constructor(public port: number = 0) {
        this.app = new Koa();
        this.router = new Router();
        this.router.get('/acLoginCallback', this.onLoginResult.bind(this));
        this.router.get('/httpCallback', this.onHttpCallback.bind(this));
        this.app.use(
            bodyParser({
                jsonLimit: '20mb',
            }),
        );
        this.app.use(this.router.routes());
        this.server = http.createServer(this.app.callback());
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, () => {
                const port = this.getServerPort();
                console.info(`Server is running on http://localhost:${port}`);
                resolve();
            }).on('error', reject);
        });
    }

    getServerPort(): number {
        return (this.server.address() as AddressInfo).port;
    }

    onLoginResult(ctx: Koa.Context) {
        const code = ctx.query.code;
        sendToAllWindows('acLoginResult', code);
        ctx.status = 200;
        ctx.type = 'html';
        ctx.body = `
        <body onload="setTimeout(() => self.close(), 100)">
        <h2>Automation Cloud Authentication</h2>
        <p>You may now close the window.</p>
        </body>
        `;
    }

    onHttpCallback(ctx: Koa.Context) {
        sendToAllWindows('httpCallbackResult', {
            method: ctx.method.toLowerCase(),
            url: ctx.url,
            query: ctx.query,
            headers: ctx.headers,
            body: ctx.body,
        });
        ctx.body = `
        <body onload="setTimeout(() => self.close(), 100)">
            <p>You may now close the window.</p>
        </body>
        `;
    }
}
