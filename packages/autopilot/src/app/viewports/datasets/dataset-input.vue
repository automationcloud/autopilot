<template>
    <div class="dataset-input"
        @contextmenu.stop.prevent="popupMenu">

        <div class="dataset-input__header group group--gap--small">
            <expand :id="expandId"/>
            <i class="color--yellow fa fa-exclamation-triangle"
                v-if="!isValid">
            </i>
            <autocomplete
                v-model.trim="key"
                class="stretch"
                input-class="frameless stretch"
                :options="inputKeys"
                placeholder="Input key"
                @change="onKeyChange"/>
            <button class="button button--icon frameless"
                @click="generateExample()"
                :disabled="!canGenerateExample">
                <i class="fa fa-magic"></i>
            </button>
            <button class="button button--icon frameless"
                @click="removeInput()">
                <i class="fa fa-trash"></i>
            </button>
        </div>

        <div class="dataset-input__content"
            v-if="isExpanded">
        <div class="dataset-input__validation-errors"
            v-if="validationErrors.length">
            <validation-error
                v-for="(e, index) of validationErrors"
                :error="e"
                :key="index"/>
        </div>
        <edit-json
            class="dataset-input__editor"
            v-model="input.data"
            @change="onValueChange"/>
        </div>

    </div>
</template>

<script>
import throttle from 'promise-smart-throttle';
import { helpers, menu, clipboard } from '../../util';
import { ExpandableController } from '~/controllers';

export default {

    props: {
        input: { type: Object },
        index: { type: Number },
    },

    data() {
        return {
            key: '',
            validationErrors: [],
        };
    },

    created() {
        this.validateThrottled = throttle(this.validate, 100);
    },

    mounted() {
        this.init();
    },

    watch: {
        domain() {
            this.validateThrottled();
        },
        input: {
            deep: true,
            handler() {
                this.init();
            }
        }
    },

    computed: {
        viewport() { return this.app.viewports.datasets; },
        dataset() { return this.app.datasets.getCurrentDataset(); },

        expandId() {
            return this.viewport.getInputExpandId(this.input);
        },

        isExpanded() {
            return this.get(ExpandableController).isExpanded(this.expandId);
        },

        inputKeys() {
            return this.app.tools.getInputKeys();
        },

        domain() {
            return this.app.tools.getDomain();
        },

        isValid() {
            return !this.validationErrors.length;
        },

        inputDef() {
            return this.domain ? this.domain.getInputDef(this.input.key) : null;
        },

        canGenerateExample() {
            return !!this.inputDef;
        },
    },

    methods: {

        removeInput() {
            this.viewport.removeInput(this.index);
        },

        init() {
            this.key = this.input.key;
            this.validateThrottled();
        },

        async validate() {
            if (!this.domain) {
                return;
            }
            const { errors } = await this.domain.validateInput(this.input.key, this.input.data);
            this.validationErrors = errors;
        },

        onKeyChange() {
            const otherKeys = this.dataset.inputs
                .filter(i => i !== this.input)
                .map(i => i.key);
            const newKey = helpers.makeSafeString(this.key, otherKeys);
            this.input.key = newKey;
            this.key = this.input.key;
            this.viewport.save();
        },

        onValueChange() {
            this.viewport.save();
        },

        popupMenu() {
            menu.popupMenu([
                {
                    label: 'Copy input',
                    click: () => clipboard.writeObject({
                        type: 'dataset-inputs',
                        data: [
                            this.input
                        ]
                    }),
                },
                {
                    label: 'Copy all inputs',
                    click: () => clipboard.writeObject({
                        type: 'dataset-inputs',
                        data: this.dataset.inputs,
                    }),
                },
                {
                    label: 'Copy all inputs as JSON',
                    click: () => clipboard.writeObject(this.viewport.getJsonInputs()),
                },
                {
                    label: 'Paste inputs',
                    click: () => this.viewport.pasteInputs(),
                    enabled: this.viewport.canPasteInputs(),
                },
            ]);
        },

        generateExample() {
            if (!this.inputDef) {
                return;
            }
            const example = this.inputDef.createExample();
            this.input.data = example;
            this.viewport.save();
        },

    }

};
</script>

<style>
.dataset-input {

}

.dataset-input__header {
    display: flex;
    flex-flow: row nowrap;
    padding: var(--gap--small);
    border-bottom: 1px solid var(--color-mono--200);
}
</style>
