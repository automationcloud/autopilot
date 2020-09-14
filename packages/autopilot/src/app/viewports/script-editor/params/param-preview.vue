<template>
    <div class="param--preview param--inset">
        <div class="section__subtitle">
            {{ label }}
        </div>

        <div v-if="value === undefined"
            class="preview-box">
            {{ param.placeholder || 'Preview not available.' }}
        </div>

        <template v-else>
            <div class="preview-box"
                :class="{
                    'preview-box--valid': isValidating && valid,
                    'preview-box--invalid': isValidating && !valid,
                }">
                <explore :data="{ preview: value }"/>
                <template v-if="isValidating">
                    <div class="preview-message preview-message--valid"
                        v-if="valid">
                        <i class="preview-message-icon fas fa-check-circle"></i>
                        <span>
                        Output is valid according to <strong>{{ domain.id }}.{{ outputKey }}</strong>.
                        </span>
                    </div>
                    <div class="preview-message preview-message--invalid"
                        v-if="!valid">
                        <i class="preview-message-icon fas fa-times-circle"></i>
                        <span>
                        Output is not valid according to <strong>{{ domain.id }}.{{ outputKey }}</strong>.
                        </span>
                    </div>
                    <div v-if="!valid"
                        class="validation-errors">
                        <validation-error
                            class="validation-error"
                            v-for="(err, i) of errors"
                            :error="err"
                            :key="i"/>
                    </div>
                </template>
                <div class="preview-message preview-message--invalid"
                    v-if="outputKeyMissing">
                    <i class="preview-message-icon fas fa-times-circle"></i>
                    <span>
                    Output key not specified.
                    </span>
                </div>
            </div>

        </template>

    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin],

    inject: [
        'protocol',
    ],

    data() {
        return {
            valid: false,
            errors: []
        };
    },

    computed: {

        isDraft() {
            return this.project.metadata.draft || false;
        },

        domain() {
            return this.protocol.getDomain();
        },

        isValidating() {
            // Note: outputs are only validated if `outputKey` exists on the item we're editing
            return !this.isDraft && !!this.outputKey && !!this.domain;
        },

        outputKey() {
            const { outputKeyProp } = this.param;
            return outputKeyProp && this.item[outputKeyProp].trim();
        },

        outputKeyMissing() {
            return this.param.outputKeyProp && !this.outputKey;
        },

    },

    mounted() {
        this.validate();
    },

    watch: {
        'domain': 'validate',
        'value': 'validate',
        'item.outputKey': 'validate',
    },

    methods: {

        async validate() {
            if (!this.isValidating) {
                return;
            }
            const { valid, errors } = await this.domain.validateOutput(this.outputKey, this.value);
            this.valid = valid;
            this.errors = errors;
        },

    }

};
</script>

<style scoped>
.preview-box {
    padding: var(--gap);
    background: var(--color-mono--200);
}

.preview-box--valid {
    background: var(--color-green--200);
}

.preview-box--invalid {
    background: var(--color-red--200);
}

.preview-message {
    margin-top: var(--gap);
    display: flex;
    align-items: center;
}

.preview-message-icon {
    font-size: 16px;
    margin-right: var(--gap--small);
}

.preview-message--valid {
    color: var(--color-green--600);
}

.preview-message--invalid {
    color: var(--color-red--500);
}

.validation-error {
    background: transparent;
    padding: 0;
    margin-top: var(--gap--small);
}

.validation-errors {
    margin-top: var(--gap);
}
</style>
