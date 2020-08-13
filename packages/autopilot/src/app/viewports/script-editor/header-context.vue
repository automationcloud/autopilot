<template>
    <div class="header-context">
        <i class="header-context__icon fas fa-map-marker-alt">
        </i>
        <div class="header-context__name">
            Context
        </div>
    </div>
</template>

<script>
export default {

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        }

    }

};
</script>

<style>
.header-context {
    flex: 1;
    display: flex;
    align-items: center;
    color: var(--ui-color--white);
}

.header-context__name {
    margin: 0 var(--gap--small);
}
</style>
