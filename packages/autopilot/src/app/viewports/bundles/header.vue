<template>
    <div class="header">
        <modal :shown="editing"
            @close="editing = false">
            <div class="section__title">
                Edit bundle
            </div>
            <div class="form-row">
                <div class="form-row__label">Name</div>
                <div class="form-row__controls">
                    <input class="input stretch"
                        v-model="bundleProxy.name"/>
                </div>
            </div>
            <div class="form-row">
                <div class="form-row__label">Private</div>
                <div class="form-row__controls">
                    <input type="checkbox"
                        v-model="bundleProxy.excluded"/>
                </div>
            </div>
            <div class="group group--gap" slot="buttons">
                <button class="button button--primary"
                    @click="editing = false">
                    Done
                </button>
            </div>
        </modal>
        <select class="input input--inverse stretch"
            v-model="bundles.bundleIndex">
            <option v-for="(ds, i) of bundles.bundles"
                :value="i">
                {{ ds.excluded ? '[private]' : '' }} {{ ds.name }}
            </option>
        </select>
        <button class="button button--inverse button--icon frameless"
            @click="popupMenu">
            <i class="fas fa-pencil-alt"></i>
        </button>
    </div>
</template>

<script>
import { menu } from '../../util';

export default {

    inject: [
        'bundles'
    ],

    data() {
        return {
            editing: false,
        };
    },

    computed: {
        bundleProxy() {
            return this.bundles.createCurrentBundleProxy();
        },
    },

    methods: {

        popupMenu() {
            return menu.popupMenu([
                {
                    label: 'Create bundle',
                    click: () => {
                        this.bundles.createBundle();
                        this.editing = true;
                    },
                },
                {
                    label: 'Edit bundle',
                    click: () => this.editing = true,
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
