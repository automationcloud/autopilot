import debounce from 'debounce-promise';
import { StorageController } from './controllers/storage';

export class UserData {
    clusterId: string;

    constructor(
        protected storage: StorageController,
        clusterId: string,
        debounceSave: number = 300
    ) {
        this.clusterId = clusterId;
        if (debounceSave) {
            const originalSaveData = this.saveData;
            this.saveData = debounce((data: any) => originalSaveData.call(this, data), debounceSave);
        }
    }

    update(data: any) {
        this.saveData(data).catch(err => console.warn(`Could not update user data ${this.clusterId}`, err));
    }

    async saveData(data: any) {
        await this.storage.saveData(this.clusterId, data);
        console.debug('Saved user data', this.clusterId);
    }

    async loadData(defaults: any = {}): Promise<any> {
        return await this.storage.loadData(this.clusterId, defaults);
    }
}
