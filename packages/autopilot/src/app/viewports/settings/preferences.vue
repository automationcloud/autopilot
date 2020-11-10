<template>
    <div class="preferences">

        <div class="section__title">
            Autopilot
        </div>
        <div class="pane">
            <div class="pane-item"
                v-if="!!apiLogin.account">
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

    </div>
</template>

<script>
import UpdateChecker from './update-checker.vue';

export default {

    inject: [
        'apiLogin',
        'tools',
        'updater',
        'settings',
    ],

    components: {
        UpdateChecker,
    },

    computed: {

    },

    methods: {

        getValue(key) {
            return this.settings.getValue(key);
        },

        setValue(key, value) {
            this.settings.setValue(key, value);
        },

    }

};
</script>

<style scoped>
.pane {
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.25);
    border-radius: var(--border-radius);
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
</style>
