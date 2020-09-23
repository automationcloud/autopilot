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

/* eslint-disable no-console */
import chalk from 'chalk';
import { Engine, Script, Request, RegistryService, ResolverService, OAuth2Agent } from '@automationcloud/engine';
import dotenv from 'dotenv';
import { diffLines } from 'diff';
import stringify from 'json-stable-stringify';
import inquirer from 'inquirer';

let yesToAll = false;

dotenv.config();

const engine = new Engine();
const auth = new OAuth2Agent({
    tokenUrl: process.env.AC_API_TOKEN_URL!,
    clientId: process.env.AC_API_CLIENT_ID!,
});

const request = new Request({
    baseUrl: process.env.AC_API_URL!,
    auth
});

main()
    .catch(err => {
        console.error(err.message);
        process.exit(1);
    });

async function main() {
    await loadExtensions();
    const services = (await getServices())
        .filter(s => !!s.scriptId);
    for (const service of services) {
        console.log(chalk.yellow(service.name));
        const scriptDescr = await getScript(service.scriptId);
        const content = await getScriptContent(service.scriptId);
        const oldJson = stringify(content.script, { space: 2 });
        const script = await Script.load(engine, content.script);
        const newJson = stringify(script, { space: 2 });
        if (oldJson === newJson) {
            console.log(`\tno changes required`);
            continue;
        }
        // await showDiff(oldJson, newJson);
        content.script = JSON.parse(newJson);
        await publish(scriptDescr, content);
    }
}

async function loadExtensions() {
    const registry = engine.get(RegistryService);
    const resolver = engine.get(ResolverService);
    const manifests = await registry.listExtensions();
    const extensions = await Promise.all(manifests.map(m =>
        registry.loadExtension(m.name, m.latestVersion)));
    for (const ext of extensions) {
        resolver.addExtension(ext);
    }
}

async function getServices(): Promise<ApiService[]> {
    const body = await request.get('/private/services', {
        query: {
            archived: false,
            limit: 1000,
        }
    });
    return body.data;
}

async function getScript(scriptId: string): Promise<ApiScript> {
    return await request.get(`/private/scripts/${scriptId}`);
}

async function getScriptContent(scriptId: string) {
    return await request.get(`/private/scripts/${scriptId}/content`);
}

async function publish(scriptDesc: ApiScript, newContent: any) {
    const newVersion = (scriptDesc.fullVersion.replace(/-migrated/g, '')) + '-mig31';
    if (!await ask(`Let's publish ${newVersion} then? Whaddyasay?`)) {
        return;
    }
    const newScript = await request.post('/private/scripts', {
        body: {
            serviceId: scriptDesc.serviceId,
            fullVersion: newVersion,
            workerTag: scriptDesc.workerTag,
            note: '🤖 Apply script migrations',
            content: newContent,
        }
    });
    await request.post(`/private/scripts/${newScript.id}/publish`);
    console.log(`\tPublished ${newVersion}`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function showDiff(oldStr: string, newStr: string) {
    const large = oldStr.length > 100000;
    const message = large ? 'Diff is super large, so better press N here' :
        'Wanna see the diff?';
    if (!await ask(message)) {
        return;
    }
    const diff = diffLines(oldStr, newStr);
    for (const chunk of diff) {
        const color = chunk.added ? chalk.green :
            chunk.removed ? chalk.red : chalk.grey;
        process.stdout.write(color.call(chalk, chunk.value));
    }
}

async function ask(message: string, ) {
    if (yesToAll) {
        return true;
    }
    const answer = await inquirer.prompt({
        type: 'expand',
        name: 'confirm',
        message,
        default: 2,
        choices: [
            { key: 'y', name: 'Yes', value: true },
            { key: 'n', name: 'No', value: false },
            { key: 'a', name: 'Yes to All', value: 'all' },
            { key: 'q', name: 'Abort', value: 'quit' },
        ],
    });
    if (answer.confirm === 'all') {
        yesToAll = true;
        return true;
    }
    if (answer.confirm === 'quit') {
        throw new Error('See ya in few weeks or so 👋');
    }
    return answer.confirm === true;
}

interface ApiService {
    id: string;
    name: string;
    scriptId: string;
}

interface ApiScript {
    id: string;
    serviceId: string;
    fullVersion: string;
    workerTag: string;
}
