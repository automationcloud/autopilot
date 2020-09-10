<template>
    <div class="disconnected"
        v-if="!attached">
        <div class="disconnected__message">
            Autopilot is not connected to Chrome.
        </div>
        <button class="button button--small button--flat"
            @click="restartChrome">
            Restart Chrome
        </button>
    </div>
</template>

<script>
export default {

    inject: [
        'browser',
        'chromeManager',
    ],

    computed: {
        attached() {
            return this.browser.isAttached();
        },
    },

    methods: {
        restartChrome() {
            this.chromeManager.init();
        },
    }

};
</script>

<style>
.disconnected {
    display: flex;
    align-items: center;
    padding: var(--gap--small);
    background: var(--color-red--500);
    color: var(--ui-color--white);
}

.disconnected__message {
    flex: 1;
}
</style>
