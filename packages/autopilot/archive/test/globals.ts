import { App, RoxiManager, ChromeManager, AssetManager, AutosaveManager } from '../main';
import { ToolsManager } from '../main/managers/tools-manager';

export async function createTestApp(userData: any) {
    const app = new TestApp(userData);
    await app.init();
    return app;
}

export class TestApp extends App {
    data: Map<string, any> = new Map();

    constructor(userData: object) {
        super();
        for (const [key, value] of Object.entries(userData)) {
            this.data.set(key, value);
        }
    }
}

export class TestStorageManager extends StorageManager {
    testApp: TestApp;

    constructor(testApp: App) {
        super(testApp);
        this.testApp = testApp as TestApp;
    }

    async saveData(clusterId: string, data: any) {
        this.testApp.data.set(clusterId, data);
    }

    async loadData(clusterId: string, defaults: any = {}): Promise<any> {
        return this.testApp.data.get(clusterId) || defaults;
    }
}

export class TestRoxiManager extends RoxiManager {
    async init() {}
}

export class TestChromeManager extends ChromeManager {
    async init() {}
}

export class TestAssetManager extends AssetManager {
    async reload() {}
}

export class TestAutosaveManager extends AutosaveManager {
    async init() {}
    async autosave() {}
}

export class TestToolsManager extends ToolsManager {
    async init() {}
}
