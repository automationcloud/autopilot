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

import { injectable, inject } from 'inversify';
import { Logger, Configuration, numberConfig, Script, Engine, ResolverService } from '@automationcloud/engine';
import { ApiService } from './api';
import LRU from 'lru-cache';

const SCRIPT_CACHE_MAX_SIZE = numberConfig('SCRIPT_CACHE_MAX_SIZE', 100);

@injectable()
export class ScriptLoaderService {
    cache: LRU<string, any>;

    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(Logger)
        protected logger: Logger,
        @inject(ApiService)
        protected api: ApiService,
        @inject(Engine)
        protected engine: Engine,
        @inject(ResolverService)
        protected resolver: ResolverService,
    ) {
        this.config = config;
        this.cache = new LRU({
            max: config.get(SCRIPT_CACHE_MAX_SIZE),
        });
    }

    async getScript(scriptId: string): Promise<Script> {
        // TODO reassess this; purging extensions remove modules from Node.js cache,
        // so they will be reloaded each time.
        // Subject for metrics.
        this.resolver.purgeExtensions();

        let scriptContent = this.cache.get(scriptId);
        if (!scriptContent) {
            scriptContent = await this.api.getScriptContent(scriptId);
            this.cache.set(scriptId, scriptContent);
        }
        const script = await Script.load(this.engine, scriptContent.script);
        return script;
    }
}
