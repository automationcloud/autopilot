// Copyright 2020 Ubio Limited
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
