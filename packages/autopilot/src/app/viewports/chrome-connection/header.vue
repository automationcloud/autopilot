<template>
    <div class="header">
        <div class="title">Browser</div>
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

<style scoped>
.header {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-between;
    color: #fff;
}
</style>
