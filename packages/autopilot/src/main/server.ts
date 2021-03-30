// Copyright 2020 UBIO Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import http from 'http';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router2';
import { AddressInfo } from 'net';

import { sendToAllWindows, windows } from './windows';

export class ControlServer {
    app: Koa;
    server: http.Server;
    router: Router;

    constructor(public port: number = 0) {
        this.app = new Koa();
        this.router = new Router();
        this.router.get('/acLoginCallback', this.onLoginResult.bind(this));
        this.router.get('/credentialsCallback', this.onCredentials.bind(this));
        // deprecated
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
        return new Promise<void>((resolve, reject) => {
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
        const { code, profileId } = ctx.query;
        const wnd = windows.find(_ => (_ as any).profile.id === profileId);
        if (wnd) {
            wnd.webContents.send('acLoginResult', code);
        }
        ctx.status = 200;
        ctx.type = 'text/html';
        ctx.body = `
        <body onload="setTimeout(() => self.close(), 100)">
        <h2>Automation Cloud Authentication</h2>
        <p>You may now close the window.</p>
        </body>
        `;
    }

    onCredentials(ctx: Koa.Context) {
        const result = ctx.query;
        sendToAllWindows('credentialsCallback', result);
        ctx.status = 200;
        ctx.type = 'text/html';
        ctx.body = `
        <body onload="setTimeout(() => self.close(), 100)">
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
        ctx.type = 'text/html';
        ctx.body = `
        <body onload="setTimeout(() => self.close(), 100)">
            <p>You may now close the window.</p>
        </body>
        `;
    }
}
