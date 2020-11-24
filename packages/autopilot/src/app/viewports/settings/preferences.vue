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
            <div class="pane-item"
                v-if="apiLogin.isAuthenticated()">
                <div class="pane-main">
                    <span class="account-icon"
                        style="margin-right: var(--gap)">
                        {{ apiLogin.userInitial }}
                    </span>
                    Signed in as {{ apiLogin.accountFullName }}
                </div>
                <div class="pane-aside">
                    <button class="button button--secondary"
                        @click="apiLogin.logout()">
                        Sign out
                    </button>
                </div>
            </div>
            <div class="pane-item">
                <div class="pane-main">
                    Current Autopilot version {{ tools.version }}
                </div>
                <div class="pane-aside">
                    <update-checker/>
                </div>
            </div>
            <div class="pane-item"
                v-if="devMode.isEnabled()">
                <div class="pane-main">
                    You're a developer!
                    <span class="fireworks" ref="fireworks">
                    </span>
                </div>
                <div class="pane-aside">
                    <button class="button button--secondary"
                        @click="devMode.setEnabled(false)">
                        Quit being a developer
                    </button>
                </div>
            </div>
        </div>

        <div class="section__title">
            On Startup
        </div>
        <div class="pane">
            <div class="pane-item">
                <div class="pane-main">
                    Load Robot School in browser on startup
                </div>
                <div class="pane-aside">
                    <toggle :value="getValue('CHROME_USE_HOMEPAGE')"
                        @input="setValue('CHROME_USE_HOMEPAGE', $event)"/>
                </div>
            </div>
        </div>

        <div class="section__title">
            Appearance
        </div>
        <div class="pane">
            <div class="pane-item">
                <div class="pane-main">
                    Show diff markers in Script panel
                </div>
                <div class="pane-aside">
                    <toggle :value="getValue('UI_DIFF_ENABLED')"
                        @input="setValue('UI_DIFF_ENABLED', $event)"/>
                </div>
            </div>
            <div class="pane-item">
                <div class="pane-main">
                    Show verbose feedback in Pipelines
                </div>
                <div class="pane-aside">
                    <toggle :value="getValue('UI_PIPE_VERBOSE_FEEDBACK')"
                        @input="setValue('UI_PIPE_VERBOSE_FEEDBACK', $event)"/>
                </div>
            </div>
            <div class="pane-item">
                <div class="pane-main">
                    Show frequently used items in menus
                </div>
                <div class="pane-aside">
                    <toggle :value="getValue('UI_SHOW_FREQUENT_ITEMS')"
                        @input="setValue('UI_SHOW_FREQUENT_ITEMS', $event)"/>
                </div>
            </div>
        </div>

        <div class="section__title">
            Chrome Connection
        </div>
        <div class="pane">
            <div class="pane-item">
                <div class="pane-main">
                    Chrome path
                    <i class="fas fa-question-circle icon-help"
                        title="The path to Chrome browser executable. Changing this value requires Autopilot restart."></i>
                    <div class="subtle">
                        {{ getValue('CHROME_PATH') }}
                    </div>
                </div>
                <div class="pane-aside">
                    <button class="button button--secondary"
                        @click="pickChromePath">
                        Edit
                    </button>
                </div>
            </div>
            <div class="pane-item">
                <div class="pane-main">
                    Start Chrome in headless mode
                    <i class="fas fa-question-circle icon-help"
                        title="The browser will run in background and can be inspected via Screencast panel. Changing this value requires Chrome restart."></i>
                </div>
                <div class="pane-aside">
                    <toggle :value="getValue('CHROME_HEADLESS')"
                        @input="setValue('CHROME_HEADLESS', $event)"/>
                </div>
            </div>
            <div class="pane-item">
                <div class="pane-main">
                    Chrome debugging port
                    <i class="fas fa-question-circle icon-help"
                        title="Chrome DevTools port to connect to. Changing this value requires Chrome restart."></i>
                </div>
                <div class="pane-aside">
                    <input class="input"
                        type="number"
                        min="1024"
                        max="65535"
                        :value="getValue('CHROME_PORT')"
                        @input="updateChromePort($event)"/>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import UpdateChecker from './update-checker.vue';
import { remote } from 'electron';
import { vfx } from '../../util';

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
.pane {
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.25);
    border-radius: var(--border-radius);
    margin: var(--gap) 0;
}

.pane-item {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    padding: var(--gap);
}

.pane-item + .pane-item {
    border-top: 1px solid var(--color-cool--100);
}

.pane-main {
    flex: 1;
}

.pane-aside {
    flex: 0 0 auto;
    margin-left: var(--gap);
}

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
    width: 5px;
    height: 5px;
    border-radius: 100%;
    background: hsl(320deg, 60%, 55%);
    animation-duration: 2s;
    animation-name: particle;
}

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
