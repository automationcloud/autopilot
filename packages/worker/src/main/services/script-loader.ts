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
