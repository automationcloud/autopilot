<template>
    <div class="datasets"
        @contextmenu.stop.prevent="popupMenu">

        <div class="datasets__inputs">
            <dataset-input v-for="(input, index) of dataset.inputs"
                :key="dataset.name + index"
                :input="input"
                :index="index"
                :dataset="dataset"/>
        </div>

        <div class="datasets__add">
            <button class="button button--primary"
                @click="addInput">
                <i class="button__icon fas fa-plus"></i>
                <span>Add input</span>
            </button>
        </div>

    </div>
</template>

<script>
import DatasetInput from './dataset-input.vue';
import { menu } from '../../util';

export default {

    components: {
        DatasetInput,
    },

    inject: [
        'datasets',
    ],

    computed: {
        viewport() { return this.app.viewports.datasets; },
        dataset() {
            return this.datasets.getCurrentDataset();
        },
    },

    methods: {

        addInput() {
            this.viewport.addInput({ key: '', stage: '', data: {} });
        },

        popupMenu() {
            menu.popupMenu([
                {
                    label: 'Paste inputs',
                    click: () => this.viewport.pasteInputs(),
                    enabled: this.viewport.canPasteInputs(),
                },
            ]);
        },

    },

};
</script>

<style>
.datasets__add {
    padding: var(--gap);
}
</style>
