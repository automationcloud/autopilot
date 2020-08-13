<template>
    <div class="link-context"
        @click="goTo">
        <i class="context-icon fas fa-map-marker-alt"></i>
        <span>{{ context.name }}</span>
    </div>
</template>

<script>
export default {

    props: {
        context: { type: Object, required: true }
    },

    methods: {

        goTo() {
            this.app.viewports.scriptFlow.activateViewport();
            this.app.viewports.scriptFlow.selectItem(this.context);
            this.app.viewports.scriptFlow.revealSelected();
        },

    }

};
</script>

<style scoped>
.link-context {
    padding: var(--gap--small);
    border-radius: var(--border-radius);
    cursor: pointer;
    background: rgba(0,0,0,.02);
}

.link-context:hover {
    background: rgba(0,0,0,.05);
}

.context-icon {
    opacity: .5;
    margin-right: var(--gap--small);
}
</style>
