import { WorkerBaseApp } from '../main';
import { TestHelpers } from './helpers';
import { RegistryService } from '@automationcloud/engine';
import { RegistryServiceMock } from './mocks/registry';

export class TestRuntime {
    app: WorkerBaseApp;

    constructor() {
        this.app = new WorkerBaseApp();
        this.app.container.bind(TestHelpers).toSelf().inSingletonScope();

        // Note: try to avoid mocking, unless necessary
        this.app.container.rebind(RegistryService).to(RegistryServiceMock).inSingletonScope();
    }

    get helpers() {
        return this.app.container.get(TestHelpers);
    }
}

export const runtime = new TestRuntime();
