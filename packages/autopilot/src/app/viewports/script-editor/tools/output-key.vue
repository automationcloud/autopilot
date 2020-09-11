<template>
    <div class="output-key">
        <autocomplete
            @input="onInput"
            :value="value"
            :options="options"
            :placeholder="placeholder">
            <i class="icon fas fa-sign-out-alt color--muted"></i>
        </autocomplete>
        <small class="color--yellow"
            v-if="domain && !outputDef">
            This output is not part of <strong>{{ domain.id }}</strong> domain.
        </small>
    </div>
</template>

<script>
export default {

    inject: [
        'protocol',
    ],

    props: {
        value: { type: String },
        placeholder: { type: String },
    },

    computed: {

        domain() {
            return this.protocol.getDomain();
        },

        options() {
            return this.domain ? this.domain.getOutputs().map(def => def.key) : [];
        },

        outputDef() {
            return this.domain ? this.domain.getOutputDef(this.value) : null;
        }

    },

    methods: {

        onInput(value) {
            this.$emit('input', value);
        }

    }

};
</script>

<style>
.output-key {
}
</style>
