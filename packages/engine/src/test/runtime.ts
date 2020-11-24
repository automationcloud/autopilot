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

import path from 'path';
import json5 from 'json5';
import { promises as fs } from 'fs';
import { CheckpointServiceMock } from './mocks/checkpoint';
import {
    Script,
    CheckpointService,
    GlobalsService,
    ResolverService,
    RegistryService,
    TestRig,
    ProxyService,
} from '../main';
import { StatsService } from '../main/services/stats';
import { RegistryServiceMock } from './mocks/registry';

export class TestRuntime extends TestRig {
    baseUrl: string = process.env.TEST_SERVER_URL || 'http://localhost:3007';

    setupEngine() {
        super.setupEngine();

        this.engine.container.bind(CheckpointServiceMock).toSelf().inSingletonScope();
        this.engine.container.rebind(CheckpointService).toService(CheckpointServiceMock);

        this.engine.container.bind(RegistryServiceMock).toSelf().inSingletonScope();
        this.engine.container.rebind(RegistryService).toService(RegistryServiceMock);
    }

    getChromeAdditionalArgs() {
        return [
            `--proxy-server=http://localhost:${this.$proxy.getProxyPort()}`,
            `--ignore-certificate-errors-spki-list=hMHyzUhJwWbOEUX/mbxS1p15qpou3qTrCgzasXyrELE=`
        ];
    }

    get $resolver() {
        return this.engine.get(ResolverService);
    }

    get $globals() {
        return this.engine.get(GlobalsService);
    }

    get $checkpoints() {
        return this.engine.get(CheckpointServiceMock);
    }

    get $stats() {
        return this.engine.get(StatsService);
    }

    get $proxy() {
        return this.engine.get(ProxyService);
    }

    get $registry() {
        return this.engine.get(RegistryServiceMock);
    }

    getUrl(url: string): string {
        return `${this.baseUrl}${url}`;
    }

    async goto(url: string, options?: any) {
        await this.page.navigate(this.getUrl(url), options);
    }

    async getScript(name: string): Promise<Script> {
        const file = path.resolve(process.cwd(), 'src/test/scripts', name + '.json5');
        const txt = await fs.readFile(file, 'utf-8');
        const json = json5.parse(txt);
        return this.createScript(json);
    }

    getAssetFile(relPath: string) {
        return path.join(process.cwd(), 'src/test/assets', relPath);
    }
}

export const runtime = new TestRuntime();
