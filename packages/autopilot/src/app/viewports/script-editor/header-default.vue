<template>
    <div class="header-default">
        Script settings
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
.header-default {
    flex: 1;
    display: flex;
    align-items: center;
    color: var(--ui-color--white);
    margin: 0 var(--gap--small);
}

</style>
