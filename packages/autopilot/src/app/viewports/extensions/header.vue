<template>
    <div class="header">
        <div class="title">Extensions</div>
        <button class="button button--inverse button--icon frameless"
            @click="refresh()">
            <i class="fas fa-spinner fa-spin" v-if="loading"></i>
            <i class="fas fa-sync-alt" v-else></i>
        </button>
    </div>
</template>

<script>

export default {

    inject: [
        'extReg',
    ],

    computed: {

        loading() {
            return this.extReg.loading;
        },

    },

    methods: {

        refresh() {
            this.extReg.refresh();
        },

    }

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
