import { getProfile, getAllProfiles, createNewProfile } from './settings';
import { ipcMain } from 'electron';
import { windows, createWindow } from './windows';
import { getUpdateInfo, installUpdates } from './updater';

export function initIpcListeners() {

    ipcMain.on('profile.activate', (_ev, id) => {
        const profile = getProfile(id);
        if (profile) {
            createWindow(profile);
        }
    });

    ipcMain.on('profile.create', () => {
        const profiles = getAllProfiles();
        const numbers = profiles.reduce((nums, p) => {
            const m = /^Profile (\d+)$/gi.exec(p.name);
            const num = m ? parseInt(m[1]) : 0;
            return nums.concat([num]);
        }, [] as number[]);
        const max = numbers.sort((a, b) => (a > b ? 1 : -1)).reverse()[0] || 0;
        const name = `Profile ${max + 1}`;
        const profile = createNewProfile(name);
        createWindow(profile);
    });

    ipcMain.on('profile.refresh', ev => {
        ev.reply('profile.countChanged', windows.length);
    });

    ipcMain.on('updater.check', ev => {
        getUpdateInfo().then(res => ev.reply('updater.checkResult', res));
    });

    ipcMain.on('updater.installUpdates', _ev => {
        installUpdates();
    });

}
