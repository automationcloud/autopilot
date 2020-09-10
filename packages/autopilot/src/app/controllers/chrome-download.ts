import { injectable, inject } from 'inversify';
import { controller } from '../controller';

export const CHROME_REVISIONS = {
    darwin: '768968',
    win32: '768966',
    linux: '768968',
};

@injectable()
@controller()
export class ChromeDownloadController {
    installed: boolean = false;

    async init() {

    }

    isInstalled() {
        return this.installed;
    }

}

/*

    mounted() {
        const [path] = this.app.settings.entries.filter(entry => /^CHROME_PATH/.test(entry[0]) && !!entry[1]);
        const chromiumPath = path || ['', ''];
        this.chromiumPath = chromiumPath[1] || '';
    },


selectChromiumApp() {
            showOpenDialog({ title: 'Select application' })
                .then(paths => {
                    this.setChromePath(paths[0]);
                })
                .catch(_ => this.chromiumPath = '');
        },

        openChromiumLink() {
            shell.openExternal(this.chromiumLink);
        },

        getChromiumLinkPrefix() {
            if (os.platform() === 'darwin') {
                return `Mac/${CHROMIUM_VERSION.MAC}`;
            }

            if (os.platform() === 'win32') {
                return `Win_x64/${CHROMIUM_VERSION.WIN}`;
            }

            if (os.platform() === 'linux') {
                return `Linux_x64/${CHROMIUM_VERSION.LINUX}`;
            }

            return '';
        },

        setChromePath(path = '') {
            if (!path) {
                this.chromiumPath = '';
                return;
            }

            this.chromiumPath = this.osPlatform === 'darwin' ?
                path + '/Contents/MacOS/Chromium' :
                path;

            this.settings.setEntries([
                ['CHROME_PATH', this.chromiumPath],
            ]);
        },

        */
