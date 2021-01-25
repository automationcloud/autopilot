<template>
    <div class="bundles"
        @contextmenu.stop.prevent="popupMenu">

        <div class="bundles__inputs">
            <bundle-input v-for="(input, index) of bundle.inputs"
                :key="bundle.name + index"
                :input="input"
                :index="index"
                :bundle="bundle"/>
        </div>

        <div style="padding: var(--gap)">
            <button class="button button--primary"
                @click="addInput">
                <i class="button__icon fas fa-plus"></i>
                <span>Add input</span>
            </button>
        </div>

    </div>
</template>

<script>
import BundleInput from './bundle-input.vue';
import { menu } from '../../util';

export default {

    components: {
        BundleInput,
    },

    inject: [
        'bundles',
    ],

    computed: {
        bundle() {
            return this.bundles.getCurrentBundle();
        },
    },

    methods: {

        addInput() {
            this.bundles.addInput({ key: '', data: {} });
        },

        popupMenu() {
            menu.popupMenu([
                {
                    label: 'Paste inputs',
                    click: () => this.bundles.pasteInputs(),
                    enabled: this.bundles.canPasteInputs(),
                },
            ]);
        },

    },

};
</script>
