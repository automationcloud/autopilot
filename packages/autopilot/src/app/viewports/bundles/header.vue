<template>
    <div class="header">
        <select class="input input--inverse stretch"
            v-model="bundles.bundleIndex">
            <option v-for="(ds, i) of bundles.bundles"
                :value="i">
                {{ ds.excluded ? '[private]' : '' }} {{ ds.name }}
            </option>
        </select>
        <button class="button button--inverse button--icon frameless"
            style="margin-left: var(--gap)"
            @click="popupMenu">
            <i class="fas fa-ellipsis-v"></i>
        </button>
    </div>
</template>

<script>
import { menu } from '../../util';

export default {

    inject: [
        'bundles',
        'modals',
    ],

    methods: {

        popupMenu() {
            return menu.popupMenu([
                {
                    label: 'Create bundle',
                    click: () => {
                        this.bundles.createBundle();
                        this.modals.show('edit-bundle');
                    },
                },
                {
                    label: 'Edit bundle',
                    click: () => this.modals.show('edit-bundle'),
                },
                {
                    label: 'Delete bundle',
                    click: () => this.bundles.deleteBundle(),
                }
            ]);
        },

    },

};
</script>

<style scoped>
.header {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-between;
}
</style>
