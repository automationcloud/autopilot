import { toolkit } from './toolkit';
import { stubs } from './stubs';
import { crosshair } from './crosshair';
import { exposeAudioUtils } from './audio-utils';

export const contentScripts = [
    { filename: 'toolkit.js', fn: toolkit },
    { filename: 'stubs.js', fn: stubs },
    { filename: 'crosshair.js', fn: crosshair },
    { filename: 'audio-utils.js', fn: exposeAudioUtils },
];
