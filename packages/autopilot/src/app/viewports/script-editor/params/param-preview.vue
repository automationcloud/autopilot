<template>
    <div class="param--preview param--inset">
        <div class="section__subtitle">
            {{ label }}
        </div>

        <div v-if="value === undefined"
            class="box box--cool">
            {{ param.placeholder || 'Preview not available.' }}
        </div>

        <template v-else>
            <explore :data="{ preview: value }"/>

            <template v-if="isValidating">
                <div class="box box--green"
                    style="margin-top: var(--gap)"
                    v-if="domain && valid">
                    Output is valid according to <strong>{{ domain.id }}.{{ outputKey }}</strong>
                </div>

                <div class="box box--red"
                    style="margin-top: var(--gap)"
                    v-else>
                    <validation-error
                        v-for="(err, i) of errors"
                        :error="err"
                        :key="i"/>
                </div>
            </template>
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
        domain() {
            return this.protocol.getDomain();
        },

        isValidating() {
            // Note: outputs are only validated if `outputKey` exists on the item we're editing
            return !!this.domain && !!this.outputKey;
        },

        outputKey() {
            return this.item.outputKey || this.item.$outputKey;
        }
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
