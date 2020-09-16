import { injectable, inject } from 'inversify';
import { controller } from '../controller';
import { StorageController } from './storage';
import { UserData } from '../userdata';
import { BrowserService, EmulationMode, EmulationService } from '@automationcloud/engine';

export type ThrottlingMode = 'none' | '3g' | '2g';

@injectable()
@controller({ backgroundInit: true })
export class EmulationController {
    userData: UserData;

    throttlingMode: ThrottlingMode = 'none';
    emulationMode: EmulationMode = 'disabled';

    constructor(
        @inject(StorageController)
        protected storage: StorageController,
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(EmulationService)
        protected emulation: EmulationService,
    ) {
        this.userData = storage.createUserData('emulation');
        this.browser.on('attached', () => this.applyThrottling());
    }

    async init() {
        const {
            throttlingMode = 'none',
            emulationMode = 'disabled',
        } = await this.userData.loadData();
        this.throttlingMode = throttlingMode;
        this.emulationMode = emulationMode;
        if (this.browser.isAttached()) {
            await this.applyEmulation();
            await this.applyThrottling();
        }
    }

    update() {
        this.userData.update({
            throttlingMode: this.throttlingMode,
            emulationMode: this.emulationMode,
        });
    }

    setEmulation(mode: EmulationMode) {
        this.emulationMode = mode;
        this.update();
        this.applyEmulation();
    }

    toggleEmulation(mode: EmulationMode) {
        const newMode = this.emulationMode === mode ? 'disabled' : mode;
        this.setEmulation(newMode);
    }

    async applyEmulation() {
        await this.emulation.setMode(this.emulationMode)
            .catch(err => console.warn('Apply emulation failed', err));
    }

    setThrottling(mode: ThrottlingMode) {
        this.throttlingMode = mode;
        this.update();
        this.applyThrottling();
    }

    toggleThrottling(mode: ThrottlingMode) {
        const newMode = this.throttlingMode === mode ? 'none' : mode;
        this.setThrottling(newMode);
    }

    async applyThrottling() {
        await this.browser.page
            .send('Network.emulateNetworkConditions', this.getThrottlingEmulationParams())
            .catch(err => console.warn('Apply throttling failed', err));
    }

    getThrottlingEmulationParams(): any {
        switch (this.throttlingMode) {
            case '3g':
                return {
                    offline: false,
                    connectionType: 'cellular3g',
                    downloadThroughput: 188743.68,
                    uploadThroughput: 86400,
                    latency: 562.5,
                };
            case '2g':
                return {
                    offline: false,
                    connectionType: 'cellular2g',
                    downloadThroughput: 51200,
                    uploadThroughput: 51200,
                    latency: 2000,
                };
            case 'none':
            default:
                return {
                    offline: false,
                    downloadThroughput: 0,
                    uploadThroughput: 0,
                    latency: 0,
                };
        }
    }

}
