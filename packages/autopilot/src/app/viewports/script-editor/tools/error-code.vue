<template>
    <autocomplete
        input-class="stretch"
        :value="value"
        @input="onInput"
        :options="options"/>
</template>

<script>
export default {

    props: {
        value: { type: String, default: '' }
    },

    computed: {

        options() {
            return this.app.tools.getErrorCodeSuggestions();
        }

    },

    methods: {
        onInput(value) {
            this.$emit('input', value);
        }
    }

};
</script>
