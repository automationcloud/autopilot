<template>
    <div class="first-run automation-cloud">
        <div class="topbar">
            <img src="resources/ubio-robot-white.svg"
                class="topbar-logo" />
            <span>Autopilot</span>
        </div>

        <div class="main">
            <div class="hero--grad section">
                <img src="resources/product-logos/autopilot.svg"
                    style="width: 150px; margin: var(--gap) 0;" />
                <div class="section-content" style="color: white;">
                    <h3>
                        Welcome to Autopilot and the Automation Cloud
                    </h3>
                    <p>
                        Autopilot allows you to script powerful,
                        contextually aware workflows on any website
                        or connect any API.
                    </p>

                    <span class="chromium-link">
                        <img src="resources/chromium-icon.png"
                            alt="chromium"
                            class="chromium-image">
                        Let's install Chromium so you can get scripting.
                    </span>
                </div>
            </div>

            <div class="section" style="flex: 1">
                <div class="section-content">
                    <h6>
                        1. Download and install Chromium.
                    </h6>
                    <div class="section-controls">
                        <button
                            class="button button--secondary button--cta"
                            @click="installChromium">
                            Install Chromium
                        </button>
                        <span class="check-icon"
                            :class="{
                                'check-icon--installed': installed,
                            }">
                            <i class="far fa-check-circle"></i>
                        </span>
                    </div>

                    <p>
                        Chromium will be installed with the Autopilot application.
                        We’ll then use that version of the browser for your automations with Autopilot.
                    </p>

                    <hr class="section-divider"/>

                    <h6>
                        2. Run scripts locally or <u>Register for Automation Cloud account</u> at any time.
                    </h6>
                    <div class="section-controls">
                        <button
                            class="button button--cta"
                            :class="{
                                'button--primary': installed,
                                'button--disabled': !installed,
                            }"
                            :disabled="!installed"
                            @click="resume">
                            Continue to Autopilot
                        </button>
                    </div>
                </div>
            </div>

            <div class="section tray-bg--transparent-mid">
                <promo-robot-school style="align-self: end;"/>
            </div>
        </div>
    </div>
</template>

<script>
import PromoRobotSchool from '~/components/automationcloud/promo-robot-school.vue';

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

    inject: [
        'settings',
        'chromeDownload',
    ],

    computed: {

        installed() {
            return this.chromeDownload.isInstalled();
        },

    },

    methods: {

        resume() {
            this.settings.setEntries([['IS_FIRST_RUN', 'false']]);
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

.main {
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

.section-controls {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
}

.section h3 {
    margin-bottom: var(--gap--large);
}

.section h6 {
    color: var(--color-blue--600);
    font-weight: 400;
}

.section-divider {
    margin: var(--gap--large) 0;
}

.check-icon {
    margin-left: var(--gap);
    font-size: 1.8em;
    color: var(--color-mono--200);
}

.check-icon--installed {
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
</style>
