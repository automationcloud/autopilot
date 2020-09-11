<template>
    <div class="browser">

        <div class="target flexrow"
            v-for="target of targets"
            tabindex="0"
            data-selection-id="target.targetId"
            @uiactivate="attach(target)"
            @dblclick="attach(target)">

            <div class="summary">
                <div class="title">
                    {{ target.title }}
                </div>
                <div class="url">
                    {{ target.url }}
                </div>
            </div>

            <button class="button button--icon frameless"
                title="Connect to this target"
                v-if="!isAttachedTo(target)"
                @click="attach(target)">
                <i class="fas fa-plug"></i>
            </button>

            <strong class="color--blue"
                v-if="isAttachedTo(target)">
                Connected
            </strong>

        </div>

    </div>
</template>

<script>
export default {

    inject: [
        'browser',
        'chromeManager',
    ],

    computed: {
        targets() {
            return this.chromeManager.targets;
        },
    },

    methods: {

        isAttachedTo(target) {
            return this.browser.isAttachedTo(target.targetId);
        },

        attach(target) {
            this.browser.attach(target.targetId);
        },

    },

};
</script>

<style scoped>
.browser {
    padding: var(--gap--small);
}

.summary {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.title {
    margin: var(--gap--small) 0;
    font-weight: 500;
}
</style>
