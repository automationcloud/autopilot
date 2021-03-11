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

import fs from 'fs';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import multer, { MulterIncomingMessage } from 'koa-multer';
import Router from 'koa-router2';
import serveStatic from 'koa-static';
import path from 'path';
import querystring from 'querystring';
import rimraf from 'rimraf';
import URL from 'url';

const uploadsDir = path.resolve(process.cwd(), '.tmp/uploads');

rimraf.sync(uploadsDir);
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({ dest: uploadsDir });

export const server = new Koa();
export const router = new Router();

server.use(
    bodyParser({
        jsonLimit: '20mb',
    }),
);

server.use(async (ctx, next) => {
    const delay = Number(ctx.query.delay);
    const status = Number(ctx.query.status);
    if (delay) {
        await new Promise(r => setTimeout(r, delay));
    }
    if (status) {
        ctx.status = status;
    }
    if (ctx.query.download) {
        ctx.response.attachment(ctx.query.download);
    }
    await next();
});

router.post('/html', async ctx => {
    const items = [];
    for (const [k, v] of Object.entries(ctx.request.body || {})) {
        items.push(`<li><span>${k}</span>: <strong>${v}</strong></li>`);
    }
    ctx.body = `<ul>${items.join('')}</ul>`;
});

router.get('/headers', async ctx => {
    ctx.body = ctx.request.headers;
});

router.post('/echo', async ctx => {
    ctx.body = ctx.request.body;
});

router.post('/redirect', async ctx => {
    const { query } = ctx;
    const { body } = ctx.request;
    const params = Object.assign({}, body, query);
    const { to } = params;
    delete params.to;
    const parsed = URL.parse(to);
    const qs = querystring.parse(parsed.query as string);
    Object.assign(qs, params);
    parsed.search = '?' + querystring.stringify(qs);
    ctx.redirect(URL.format(parsed));
});

router.post('/upload', upload.single('myFile'), async ctx => {
    const { file, body } = ctx.req as MulterIncomingMessage;
    const stat = fs.statSync(file.path);
    const text = fs.readFileSync(file.path, 'utf8');
    ctx.body = {
        stat,
        text: text.length > 1000 ? `<${(text.length / 1024).toFixed(2)} KB>` : text,
        file: file.path,
        field: body.myField,
    };
});

router.get('/error/:status', async ctx => {
    ctx.throw(Number((ctx as any).params.status));
});

server.use(router.routes());
server.use(serveStatic(`${process.cwd()}/src/test/assets`));

server.listen(3007).on('error', err => {
    // eslint-disable-next-line no-console
    console.warn(err.message);
});
