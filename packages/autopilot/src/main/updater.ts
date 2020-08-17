import { autoUpdater } from 'electron-updater';
import { getSettings } from './settings';

export function checkForUpdates() {
    const settings = getSettings();
    autoUpdater.allowPrerelease = settings.channel === 'beta';
    autoUpdater.checkForUpdatesAndNotify();
}
