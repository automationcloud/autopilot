<template>
    <div class="header">
        <div class="title">Browser</div>
        <button class="button button--inverse button--icon frameless"
            @click="chromeManager.refreshTargets()"
            title="Refresh targets">
            <i class="fas fa-sync-alt"></i>
        </button>
    </div>
</template>

<script>
export default {

    inject: [
        'chromeManager'
    ],

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
