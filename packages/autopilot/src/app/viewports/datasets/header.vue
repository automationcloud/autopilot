<template>
    <div class="header">
        <modal class="section"
            :shown="editing"
            @close="editing = false">
            <div class="section__title">
                Edit dataset
            </div>
            <div class="form-row">
                <div class="form-row__label">Name</div>
                <div class="form-row__controls">
                    <input class="input"
                        v-model="datasetProxy.name"/>
                </div>
            </div>
            <div class="form-row">
                <div class="form-row__label">Private</div>
                <div class="form-row__controls">
                    <input type="checkbox"
                        v-model="datasetProxy.excluded"/>
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
            v-model="currentIndex">
            <option v-for="(ds, i) of allDatasets"
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
        'datasets'
    ],

    data() {
        return {
            editing: false,
        };
    },

    computed: {
        viewport() { return this.app.viewports.datasets; },

        currentIndex: {
            get() {
                return this.datasets.currentIndex;
            },
            set(index) {
                this.datasets.selectDataset(index);
            }
        },

        allDatasets() {
            return this.datasets.datasets;
        },

        datasetProxy() {
            return this.viewport.createCurrentDatasetProxy();
        },
    },

    methods: {

        popupMenu() {
            return menu.popupMenu([
                {
                    label: 'Create dataset',
                    click: () => {
                        this.datasets.createDataset();
                        this.editing = true;
                    },
                },
                {
                    label: 'Edit dataset',
                    click: () => this.editing = true,
                },
                {
                    label: 'Delete dataset',
                    click: () => this.datasets.deleteCurrentDataset(),
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
    color: #fff;
}
</style>
