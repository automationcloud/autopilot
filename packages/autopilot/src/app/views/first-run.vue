<template>
    <div class="first-run automation-cloud">
        <div class="topbar">
            <img src="resources/ubio-robot-white.svg"
                class="topbar-logo" />
            <span>Autopilot</span>
        </div>

        <div class="container">
            <section class="hero--grad section">
                <img src="resources/product-logos/autopilot.svg" style="width: 150px; margin: var(--gap) 0;" />
                <div class="section-content" style="color: white;">
                    <h3 style="margin-bottom: var(--gap);">Welcome to Autopilot and the Automation Cloud</h3>
                    <p>Autopilot allows you to script powerful, contextually aware workflows on any website or connect any API.</p>

                    <span class="chromium-link">
                        <img src="resources/chromium-icon.png" alt="chromium" class="chromium-image">
                        Let's get connect Autopilot to Chromium so you can get scripting.
                    </span>
                </div>
            </section>

            <section class="section">
                <div class="section-content">
                    <h6>1. Download and install Chromium.</h6>
                    <button
                        class="button button--secondary "
                        @click.prevent="openChromiumLink">
                        Download Chromium
                    </button>
                </div>

                <div class="section-content">
                    <h6>2. Connect Chromium to Autopilot</h6>
                    <div class="chromium-select">
                        <span>Chromium: </span>
                        <button type="click"
                            class="button button--secondary"
                            @click="selectChromiumApp">
                            Find Chromium Application
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
            </section>

            <section class="section tray-bg--light-mid">
                <div class="section-content" style="margin-bottom: var(--gap--large);">
                    <h6>Run scripts locally or <u> Regiter for Automation Cloud account</u> at any time.</h6>
                    <button
                        class="button"
                        :class="{
                            'button--primary': valid,
                            'button--disabled': !valid,
                        }"
                        :disabled="!valid"
                        @click="saveAndReload">
                        Continue to Autopilot
                    </button>
                </div>

                <promo-robot-school style="align-self: end;"/>
            </section>
        </div>
    </div>
</template>

<script>
import PromoRobotSchool from '~/components/automationcloud/promo-robot-school.vue';
import { SettingsController } from '~/controllers';
import { showOpenDialog } from '../util/helpers';
import os from 'os';
import { shell } from 'electron';

export const CHROMIUM_VERSION = {
    MAC: '768968',
    WIN: '768966',
    LINUX: '768968',
};

const CHROMIUM_URL = 'https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html';

export default {
    components: {
        PromoRobotSchool
    },

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
    justify-content: space-between;
}

.section {
    padding: var(--gap) var(--gap--large);
    display: flex;
    flex-flow: column wrap;
}

.section-content {
    padding: var(--gap) var(--gap--large);
    width: 100%;
    max-width: 450px;
    align-self: center;
}

.section h6 {
    color: var(--color-blue--600);
    font-weight: 400;
}

.check-icon {
    margin-left: var(--gap);
    font-size: 1.8em;
    color: var(--color-mono--200);
}

.check-icon--valid {
    color: var(--ui-color--green);
}

.chromium-link {
    display: flex;
    align-items: center;
    margin-top: var(--gap);
}

.chromium-image {
    margin-right: var(--gap);
    width: 25px;
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
