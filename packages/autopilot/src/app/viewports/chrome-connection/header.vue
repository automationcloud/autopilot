<template>
    <div class="chrome-connection-header group group--gap--small stretch">
        <div class="stretch">
        </div>
        <button class="button button--inverse button--icon frameless"
            @click="refresh()"
            title="Refresh targets">
            <i class="fas fa-sync-alt"></i>
        </button>
    </div>
</template>

<script>
export default {

    methods: {

        refresh() {
            this.app.chromeManager.refreshTargets();
        }

    },

};
</script>

<style>
</style>
