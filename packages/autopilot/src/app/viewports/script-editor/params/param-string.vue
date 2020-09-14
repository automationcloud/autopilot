<template>
    <div class="param--string param--inset">

        <label class="param__field">
            <div class="param__label">
                {{ label }}
            </div>
            <div class="param__controls">
                <autocomplete
                    v-model="value"
                    :placeholder="param.placeholder"
                    :options="createSourceOptions(param.source)"/>
            </div>
        </label>

        <template v-if="isValidateKey">
            <div class="validate-message validate-message--warn"
                v-if="!isKeyValid">
                <i class="validate-message-icon fas fa-times-circle"></i>
                <span v-if="value">
                This {{ param.source == 'inputs' ? 'input' : 'output' }} is not part
                of <strong>{{ domain.id }}</strong> domain.
                </span>
                <span v-else>
                {{ param.source == 'inputs' ? 'Input' : 'Output' }} key is required.
                </span>
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
        'project',
    ],

    computed: {

        isDraft() {
            return this.project.metadata.draft || false;
        },

        domain() {
            return this.protocol.getDomain();
        },

        isValidateKey() {
            return !this.isDraft &&
                !!this.domain &&
                ['inputs', 'outputs'].includes(this.param.source);
        },

        isKeyValid() {
            switch (this.param.source) {
                case 'inputs':
                    return !!this.domain.getInputDef(this.value);
                case 'outputs':
                    return !!this.domain.getOutputDef(this.value);
                default:
                    return true;
            }
        },

    }

};
</script>

<style scoped>
.validate-message {
    margin-top: var(--gap);
    display: flex;
    align-items: center;
}

.validate-message-icon {
    font-size: 16px;
    margin-right: var(--gap--small);
}

.validate-message--valid {
    color: var(--color-green--600);
}

.validate-message--warn {
    color: var(--color-yellow--500);
}

.validate-message--invalid {
    color: var(--color-red--500);
}
</style>
