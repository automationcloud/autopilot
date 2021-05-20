<template>
    <div class="preferences">

        <div class="section__title magic-place"
            @click="devMode.registerClick()">
            Autopilot
        </div>

        <div style="position:relative">
            <div class="dev-prompt" v-if="devMode.clicks > 2">
                Click {{ devMode.remainingClicks }} more
                time{{ devMode.remainingClicks > 1 ? 's' : '' }} to become an
                <strong>awesome</strong> Autopilot developer!
            </div>
        </div>

        <div class="pane">
            <div class="pane__item"
                v-if="apiLogin.isAuthenticated()">
                <div class="pane__main">
                    <span class="account-icon"
                        style="margin-right: var(--gap)">
                        {{ apiLogin.userInitial }}
                    </span>
                    Signed in as {{ apiLogin.accountFullName }}
                </div>
                <div class="pane__aside">
                    <button class="button button--secondary"
                        @click="apiLogin.logout()">
                        Sign out
                    </button>
                </div>
            </div>
            <div class="pane__item">
                <div class="pane__main">
                    Current Autopilot version {{ tools.version }}
                </div>
                <div class="pane__aside">
                    <update-checker/>
                </div>
            </div>
            <div class="pane__item"
                v-if="devMode.isEnabled()">
                <div class="pane__main">
                    You're a developer!
                    <span class="fireworks" ref="fireworks">
                    </span>
                </div>
                <div class="pane__aside">
                    <button class="button button--secondary"
                        @click="devMode.setEnabled(false)">
                        Quit being a developer
                    </button>
                </div>
            </div>
            <div class="pane__item">
                <div class="pane__main">
                    Load Robot School in browser on startup
                </div>
                <div class="pane__aside">
                    <toggle :value="getValue('CHROME_USE_HOMEPAGE')"
                        @input="setValue('CHROME_USE_HOMEPAGE', $event)"/>
                </div>
            </div>
        </div>

        <div class="section__title">
            Chrome Connection
        </div>
        <div class="pane">
            <div class="pane__item">
                <div class="pane__main">
                    Chrome path
                    <i class="fas fa-question-circle icon-help"
                        title="The path to Chrome browser executable. Changing this value requires Autopilot restart."></i>
                    <div class="subtle">
                        {{ getValue('CHROME_PATH') }}
                    </div>
                </div>
                <div class="pane__aside">
                    <button class="button button--secondary"
                        @click="pickChromePath">
                        Edit
                    </button>
                </div>
            </div>
            <div class="pane__item">
                <div class="pane__main">
                    Start Chrome in headless mode
                    <i class="fas fa-question-circle icon-help"
                        title="The browser will run in background and can be inspected via Screencast panel. Changing this value requires Chrome restart."></i>
                </div>
                <div class="pane__aside">
                    <toggle :value="getValue('CHROME_HEADLESS')"
                        @input="setValue('CHROME_HEADLESS', $event)"/>
                </div>
            </div>
            <div class="pane__item">
                <div class="pane__main">
                    Chrome debugging port
                    <i class="fas fa-question-circle icon-help"
                        title="Chrome DevTools port to connect to. Changing this value requires Chrome restart."></i>
                </div>
                <div class="pane__aside">
                    <input class="input"
                        type="number"
                        min="1024"
                        max="65535"
                        :value="getValue('CHROME_PORT')"
                        @input="updateChromePort($event)"/>
                </div>
            </div>
        </div>

        <div class="section__title">
            UI
        </div>
        <div class="pane">
            <div class="pane__item">
                <div class="pane__main">
                    Show diff markers in Script panel
                </div>
                <div class="pane__aside">
                    <toggle :value="getValue('UI_DIFF_ENABLED')"
                        @input="setValue('UI_DIFF_ENABLED', $event)"/>
                </div>
            </div>
            <div class="pane__item"
                v-if="devMode.isEnabled()">
                <div class="pane__main">
                    Enable Pipeline feedback
                    <i class="fas fa-question-circle icon-help"
                        title="This will disable intermediate results in pipelines."></i>
                </div>
                <div class="pane__aside">
                    <toggle :value="getValue('UI_PIPE_FEEDBACK_ENABLED')"
                        @input="setValue('UI_PIPE_FEEDBACK_ENABLED', $event)"/>
                </div>
            </div>
            <div class="pane__item">
                <div class="pane__main">
                    Show verbose feedback in Pipelines
                </div>
                <div class="pane__aside">
                    <toggle :value="getValue('UI_PIPE_VERBOSE_FEEDBACK')"
                        @input="setValue('UI_PIPE_VERBOSE_FEEDBACK', $event)"/>
                </div>
            </div>
            <div class="pane__item">
                <div class="pane__main">
                    Show frequently used items in menus
                </div>
                <div class="pane__aside">
                    <toggle :value="getValue('UI_SHOW_FREQUENT_ITEMS')"
                        @input="setValue('UI_SHOW_FREQUENT_ITEMS', $event)"/>
                </div>
            </div>
            <div class="pane__item">
                <div class="pane__main">
                    Pre-compose common actions
                </div>
                <div class="pane__aside">
                    <toggle :value="getValue('COMPOSITION_ENABLED')"
                        @input="setValue('COMPOSITION_ENABLED', $event)"/>
                </div>
            </div>
        </div>

        <template v-if="devMode.isEnabled()">
            <div class="section__title">
                Configuration
            </div>
            <configuration/>
        </template>

    </div>
</template>

<script>
import { remote } from 'electron';

import { vfx } from '../../util';
import Configuration from './configuration.vue';
import UpdateChecker from './update-checker.vue';

const { dialog } = remote;

export default {

    inject: [
        'apiLogin',
        'tools',
        'updater',
        'settings',
        'devMode',
    ],

    components: {
        UpdateChecker,
        Configuration,
    },

    watch: {
        'isDevModeEnabled'(value) {
            if (value) {
                this.celebrate();
            }
        }
    },

    computed: {
        isDevModeEnabled() {
            return this.devMode.isEnabled();
        }
    },

    methods: {

        getValue(key) {
            return this.settings.getValue(key);
        },

        setValue(key, value) {
            this.settings.setValue(key, value);
        },

        async pickChromePath() {
            const { filePaths } = await dialog.showOpenDialog({
                title: 'Chrome Path',
                properties: [
                    'openFile',
                    'treatPackageAsDirectory',
                ]
            });
            if (!filePaths.length) {
                return;
            }
            const file = filePaths[0];
            this.setValue('CHROME_PATH', file);
        },

        updateChromePort(ev) {
            const port = Math.min(Math.max(0, ev.target.value), 65535);
            this.setValue('CHROME_PORT', port);
        },

        celebrate() {
            setTimeout(() => vfx.fireworks(this.$refs.fireworks, { count: 50 }), 50);
        }

    }

};
</script>

<style scoped>
.subtle {
    margin: var(--gap--small) 0;
    font-size: var(--font-size);
}

.icon-help {
    color: var(--color-blue--500);
    margin: 0 var(--gap--small);
}

.dev-prompt {
    position: absolute;
    top: -4px;
    left: -4px;
    z-index: 5;
    background: rgba(255,255,255,.85);
    padding: 1em;
    border-radius: var(--border-radius);
    box-shadow: 0 3px 5px rgba(0,0,0,.25);
}

.magic-place {
    position: relative;
    user-select: none;
}

.fireworks {
    position: absolute;
}

.fireworks >>> .particle {
    position: absolute;
    border-radius: 100%;
    animation-duration: 2s;
    animation-name: particle;
    width: 5px;
    height: 5px;
    background: hsl(320deg, 60%, 55%);
}

.fireworks >>> .particle:nth-child(3n) { width: 3px; height: 3px }
.fireworks >>> .particle:nth-child(3n + 1) { width: 4px; height: 4px }
.fireworks >>> .particle:nth-child(3n + 2) { width: 5px; height: 5px }

.fireworks >>> .particle:nth-child(4n) { background: hsl(320deg, 60%, 55%); }
.fireworks >>> .particle:nth-child(4n + 1) { background: hsl(16deg, 60%, 55%); }
.fireworks >>> .particle:nth-child(4n + 2) { background: hsl(200deg, 50%, 75%); }
.fireworks >>> .particle:nth-child(4n + 3) { background: hsl(280deg, 50%, 75%); }

@keyframes particle {
  0% {
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>
