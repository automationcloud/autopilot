import { remote } from 'electron';
import path from 'path';

// Extract properties set by main process
const wnd = remote.getCurrentWindow();
const { profile, appPath, controlServerPort } = wnd as any;

export {
    profile,
    appPath,
    controlServerPort,
};

export function getAppPath() {
    return path.resolve(appPath);
}
