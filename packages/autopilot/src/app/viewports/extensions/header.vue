<template>
    <div class="header">
        <span class="title">Extensions</span>
        <button class="button button--inverse button--icon frameless"
            @click="refresh()">
            <i class="fas fa-spinner fa-spin" v-if="loading"></i>
            <i class="fas fa-sync-alt" v-else></i>
        </button>
    </div>
</template>

<script>
import { ExtensionRegistryController } from '~/controllers';

export default {

    computed: {

        extRegistry() {
            return this.get(ExtensionRegistryController);
        },

        loading() {
            return this.extRegistry.loading;
        },

    },

    methods: {

        refresh() {
            this.extRegistry.refresh();
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
}

.title {
    color: #fff;
}
</style>
