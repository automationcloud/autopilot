<template>
    <div class="bundle-input"
        @contextmenu.stop.prevent="popupMenu">

        <div class="bundle-input__header group group--gap--small">
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

        <div class="bundle-input__content"
            v-if="isExpanded">
        <div class="bundle-input__validation-errors"
            v-if="validationErrors.length">
            <validation-error
                v-for="(e, index) of validationErrors"
                :error="e"
                :key="index"/>
        </div>
        <edit-json
            class="bundle-input__editor"
            v-model="input.data"
            @change="onValueChange"/>
        </div>

    </div>
</template>

<script>
import debounce from 'debounce';
import { helpers, menu, clipboard } from '../../util';

export default {

    inject: [
        'expandable',
        'protocol',
        'bundles',
    ],

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
        this.validateDebounced = debounce(this.validate, 100);
    },

    mounted() {
        this.init();
    },

    watch: {
        domain() {
            this.validateDebounced();
        },
        input: {
            deep: true,
            handler() {
                this.init();
            }
        }
    },

    computed: {
        bundle() { return this.bundles.getCurrentBundle(); },

        expandId() {
            return this.bundles.getInputExpandId(this.input);
        },

        isExpanded() {
            return this.expandable.isExpanded(this.expandId);
        },

        inputKeys() {
            return this.protocol.getInputKeys();
        },

        domain() {
            return this.protocol.getDomain();
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
            this.bundles.removeInput(this.index);
        },

        init() {
            this.key = this.input.key;
            this.validateDebounced();
        },

        async validate() {
            if (!this.domain) {
                return;
            }
            const { errors } = await this.domain.validateInput(this.input.key, this.input.data);
            this.validationErrors = errors;
        },

        onKeyChange() {
            const otherKeys = this.bundle.inputs
                .filter(i => i !== this.input)
                .map(i => i.key);
            const newKey = helpers.makeSafeString(this.key, otherKeys);
            this.input.key = newKey;
            this.key = this.input.key;
            this.bundles.save();
        },

        onValueChange() {
            this.bundles.save();
        },

        popupMenu() {
            menu.popupMenu([
                {
                    label: 'Copy input',
                    click: () => this.bundles.copyInput(this.input),
                },
                {
                    label: 'Copy all inputs',
                    click: () => this.bundles.copyAllInputs(),
                },
                {
                    label: 'Copy all inputs as JSON',
                    click: () => clipboard.writeObject(this.bundles.getJsonInputs()),
                },
                {
                    label: 'Paste inputs',
                    click: () => this.bundles.pasteInputs(),
                    enabled: this.bundles.canPasteInputs(),
                },
            ]);
        },

        generateExample() {
            if (!this.inputDef) {
                return;
            }
            const example = this.inputDef.createExample();
            this.input.data = example;
            this.bundles.save();
        }

    }

};
</script>

<style>
.bundle-input {

}

.bundle-input__header {
    display: flex;
    flex-flow: row nowrap;
    padding: var(--gap--small);
    border-bottom: 1px solid var(--color-mono--200);
}
</style>
