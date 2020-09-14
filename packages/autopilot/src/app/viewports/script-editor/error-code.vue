<template>
    <autocomplete
        input-class="stretch"
        :value="value"
        @input="onInput"
        :options="options"/>
</template>

<script>
export default {

    inject: [
        'protocol',
    ],

    props: {
        value: { type: String, default: '' }
    },

    computed: {

        options() {
            return this.protocol.getErrorCodeSuggestions();
        }

    },

    methods: {
        onInput(value) {
            this.$emit('input', value);
        }
    }

};
</script>
