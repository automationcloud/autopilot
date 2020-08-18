<template>
    <div class="first-run">
        <div class="topbar">
            <img src="resources/ubio-robot-white.svg"
                class="topbar-logo" />
            <span>UBIO Autopilot</span>
        </div>

        <div class="container">
            <main class="main">
                <div class="welcome">
                    <img src="resources/ubio-cloud-red.svg"
                        class="welcome-logo" />
                    <div>
                        <h4><strong>Welcome to UBIO Autopilot</strong></h4>
                        <p>Set up your connection to the UBIO API and a connection to your Chromium browser to get started with UBIO Autopilot.</p>
                    </div>
                </div>

                <div class="section">
                    <h6>CHROMIUM CONNECTION</h6>
                    <span class="chromium-link">
                        <img src="resources/chromium-icon.png" alt="chromium" class="chromium-image">
                        <a :href="chromiumLink" target="_blank" @click.prevent="openInBrowser">Download and install the compatible build of Chromium.</a>
                    </span>
                    <div class="chromium-select">
                        <b>Chromium: </b>
                        <button type="click"
                            class="button"
                            @click="selectChromiumApp">
                            <b>Find application</b>
                        </button>
                        <span class="check-icon"
                            :class="{
                                'check-icon--valid': chromiumPath
                            }">
                             <i class="far fa-check-circle"></i>
                        </span>
                        <span class="chromium-path"> {{ chromiumPath }} </span>
                    </div>
                </div>
            </main>

            <footer class="footer">
                <button
                    class="button"
                    :class="{
                        'button--primary': valid
                    }"
                    :disabled="!valid"
                    @click="saveAndReload">
                    Continue to Autopilot
                </button>
            </footer>
        </div>
    </div>
</template>

<script>
import { SettingsController } from '~/controllers';
import { showOpenDialog } from '../util/helpers';
import os from 'os';
import { remote } from 'electron';

export const CHROMIUM_VERSION = '768968';
const CHROMIUM_URL = 'https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html';

export default {
    data() {
        return {
            chromiumPath: '',
        };
    },

    mounted() {
        const [path] = this.app.settings.entries.filter(entry => /^CHROME_PATH/.test(entry[0]) && !!entry[1]);
        const chromiumPath = path || ['', ''];
        this.chromiumPath = chromiumPath[1] || '';
    },

    computed: {

        settings() {
            return this.get(SettingsController);
        },

        osPlatform() {
            return os.platform();
        },

        valid() {
            return this.chromiumPath;
        },

        chromiumLink() {
            const prefix = this.getChromiumLinkPrefix();
            return `${CHROMIUM_URL}?prefix=${prefix}/`;
        },

    },

    methods: {

        selectChromiumApp() {
            showOpenDialog({ title: 'Select application' })
                .then(paths => {
                    this.setChromePath(paths[0]);
                })
                .catch(_ => this.chromiumPath = '');
        },

        openInBrowser(e) {
            remote.shell.openExternal(e.target.href);
        },

        getChromiumLinkPrefix() {
            if (os.platform() === 'darwin') {
                return `Mac/${CHROMIUM_VERSION}`;
            }

            if (os.platform() === 'win32') {
                return `Win_x64/${CHROMIUM_VERSION}`;
            }

            if (os.platform() === 'linux') {
                return `Linux_x64/${CHROMIUM_VERSION}`;
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

        saveAndReload() {
            this.settings.setEntriesAsync([['IS_FIRST_RUN', 'false']])
                .then(_ => location.reload());
        },
    }
};
</script>

<style scoped>
.first-run {
    display: flex;
    flex-flow: column nowrap;
    overflow: hidden;
    height: 100vh;
}

.topbar {
    --link-vertical-gap: 10px;
    flex: 0 0 auto;
    display: flex;
    flex-flow: row nowrap;

    background: var(--color-mono--800);
    color: var(--ui-color--white);

    -webkit-app-region: drag;
    user-select: none;
    justify-content: center;
    align-items: center;
    min-height: 35px;
}

.topbar-logo {
    padding: 0 var(--gap);
    user-select: none;
    -webkit-user-drag: none;
}

.container {
    overflow-y: auto;
    height: inherit;
    display: flex;
    flex-direction: column;
}

.main {
    padding: var(--gap) var(--gap--large);
    flex: 1;
    overflow-y: visible;
}

.welcome {
    display: flex;
    flex-flow: row nowrap;
    margin: var(--gap--large) 0;
    max-width: 450px;
}

.welcome h4 {
    margin-bottom: var(--gap--large);
}

.welcome-logo {
    width: 70px;
    height: 70px;
    margin-right: var(--gap--large);
}

.section {
    border-top: 0.5px solid #A3B8C6;
    padding: var(--gap) 0 var(--gap--large) 0;
    max-width: 450px;
}

.section h6 {
    color: #789FBC;
    font-weight: 400;
    letter-spacing: 1px;
}

.key {
    margin: var(--gap) 0;
    display: flex;
}

.key-input {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
}

.key-input > span {
    margin: 1em 0 0 0;
}

.check-icon {
    margin-left: var(--gap);
    font-size: 2em;
    color: var(--ui-color--muted);
}

.check-icon--valid {
    color: var(--ui-color--green);
}

.chromium-link {
    display: flex;
    align-items: center;
    margin-bottom: var(--gap);
}

.chromium-image {
    margin: 0 var(--gap--small) 0 0;
    width: 20px;
    height: 20px;
}

.chromium-select {
    display: flex;
    align-items: center;
    flex-flow: row wrap;
}

.chromium-select > * {
    margin-right: var(--gap--small);
}

.chromium-path {
    display: inline-block;
    padding: var(--gap--small) 0;
}

.footer {
    background-color: var(--color-mono--300);
    display: flex;
    flex-direction: row-reverse;
    align-items: end;
}

.footer button {
    color: var(--ui-color--white);
    margin: var(--gap);
    margin-right: var(--gap--large);
}

.footer button:disabled {
    background-color: var(--color-mono--500);
    color: var(--ui-color--white);
}

</style>
