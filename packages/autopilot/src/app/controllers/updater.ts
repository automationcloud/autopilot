import { ipcRenderer } from 'electron';
import { injectable } from 'inversify';
import semver from 'semver';

import { controller } from '../controller';
import { version } from '../globals';

@injectable()
@controller({ alias: 'updater' })
export class UpdaterController {
    checkResult: CheckResults | null = null;

    async init() {
        ipcRenderer.on('updater.checkResult', (ev, res) => {
            this.checkResult = res;
        });
        this.checkUpdates();
    }

    checkUpdates() {
        ipcRenderer.send('updater.check');
    }

    get isReady() {
        return !!this.checkResult;
    }

    get upstreamVersion() {
        return this.checkResult?.version ?? '';
    }

    get isUpToDate() {
        return semver.gte(version, this.upstreamVersion);
    }

    installUpdates() {
        ipcRenderer.send('updater.installUpdates');
    }

}

interface CheckResults {
    version: string;
}
