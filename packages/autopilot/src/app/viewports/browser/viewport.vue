<template>
    <div class="browser">

        <div class="section__title">
            Active connection
        </div>

        <div class="target"
            :class="{
                'target--connected': isAttachedTo(target)
            }"
            v-for="target of targets"
            data-selection-id="target.targetId"
            @uiactivate="attach(target)">

            <div class="summary">
                <div class="title">
                    {{ target.title }}
                </div>
                <div class="url">
                    {{ target.url }}
                </div>
            </div>

            <button class="button button--secondary"
                title="Connect to this target"
                v-if="!isAttachedTo(target)"
                @click="attach(target)">
                Connect
            </button>

            <strong v-if="isAttachedTo(target)"
                style="padding: var(--gap)">
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

.title {
    margin: var(--gap--small) 0;
    font-weight: 500;
}

.target {
    display: flex;
    align-items: center;
    background: var(--color-mono--100);
    border-radius: var(--border-radius);
    padding: var(--gap);
}

.target + .target {
    margin-top: var(--gap);
}

.target--connected {
    background: var(--color-green--500);
    color: #fff;
}

.summary {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
