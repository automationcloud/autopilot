<template>
    <div class="system-notifications"
        v-if="systemNotifications.length > 0">
        <notification v-for="n in systemNotifications"
            :key="n.id"
            :notification="n"/>
    </div>
</template>

<script>
export default {

    inject: [
        'browser',
        'chromeManager',
    ],

    computed: {

        systemNotifications() {
            const res = [];
            if (!this.browser.isAttached()) {
                res.push({
                    id: 'detached',
                    kind: 'detached',
                    level: 'fatal',
                    style: 'stretch',
                    icon: 'fas fa-meh',
                    title: 'Autopilot is not connected to Chrome.',
                    isClosable: false,
                    primaryAction: {
                        title: 'Connect',
                        action: () => this.restartChrome(),
                    },
                });
            }
            return res;
        },

    },

    methods: {

        restartChrome() {
            this.chromeManager.init();
        },

    }

};
</script>

<style scoped>
.system-notifications {
    padding: var(--gap);
    background: var(--color-cool--300);
}
</style>
