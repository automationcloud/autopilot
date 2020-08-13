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
