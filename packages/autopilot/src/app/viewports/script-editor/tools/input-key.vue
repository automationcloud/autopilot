<template>
    <div class="input-key">
        <autocomplete
            @input="onInput"
            :value="value"
            :options="options">
            <i class="icon fas fa-sign-in-alt color--muted"></i>
        </autocomplete>
        <small class="color--yellow"
            v-if="domain && !inputDef">
            This input is not part of <strong>{{ domain.id }}</strong> domain.
        </small>
    </div>
</template>

<script>
export default {

    inject: [
        'protocol',
    ],

    props: {
        value: { type: String }
    },

    computed: {

        domain() {
            return this.protocol.getDomain();
        },

        options() {
            return this.domain ? this.domain.getInputs().map(def => def.key) : [];
        },

        inputDef() {
            return this.domain ? this.domain.getInputDef(this.value) : null;
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
</style>
