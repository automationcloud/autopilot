<template>
    <div class="chrome-connection">

        <div class="chrome-connection__target flexrow"
            v-for="target of targets"
            tabindex="0"
            data-selection-id="target.targetId"
            @uiactivate="attach(target)"
            @dblclick="attach(target)">

            <div class="chrome-connection__summary">
                <div class="chrome-connection__title">
                    {{ target.title }}
                </div>
                <div class="chrome-connection__url">
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

    components: {
    },

    computed: {

        targets() {
            return this.app.chromeManager.targets;
        },

    },

    methods: {

        isAttachedTo(target) {
            return this.app.browser.isAttachedTo(target.targetId);
        },

        attach(target) {
            this.app.browser.attach(target.targetId);
        },

    },

};
</script>

<style>
.chrome-connection {
    padding: var(--gap--small);
}

.chrome-connection__summary {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chrome-connection__title {
    margin: var(--gap--small) 0;
    font-weight: 500;
}
</style>
