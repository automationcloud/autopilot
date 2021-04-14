<template>
    <div class="link-action"
        @click="goTo">
        <i class="action-icon" :class="icon"></i>
        <span class="type">{{ action.type }}</span>
        <span class="name">{{ action.label }}</span>
    </div>
</template>

<script>
export default {

    inject: [
        'editor',
    ],

    props: {
        action: { type: Object, required: true }
    },

    computed: {
        icon() {
            return this.editor.getActionIcon(this.action.type);
        }
    },

    methods: {

        goTo() {
            this.app.viewports.scriptFlow.activateViewport();
            this.app.viewports.scriptFlow.selectItem(this.action);
            this.app.viewports.scriptFlow.revealSelected();
        },

    }

};
</script>

<style scoped>
.link-action {
    padding: var(--gap--small);
    border-radius: var(--border-radius);
    cursor: pointer;
    background: rgba(0,0,0,.02);
}

.link-action:hover {
    background: rgba(0,0,0,.05);
}

.action-icon {
    opacity: .5;
    margin-right: var(--gap--small);
}
</style>
