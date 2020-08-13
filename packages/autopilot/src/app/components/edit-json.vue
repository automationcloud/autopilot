<template>
    <div class="edit-json">
        <error class="edit-json__error"
            :err="jsonError"/>
        <codemirror class="edit-json__editor"
            :value="jsonSource"
            :line-numbers="lineNumbers"
            @input="onInput"/>
    </div>
</template>

<script>
import JSON5 from 'json5';

export default {

    props: {
        value: {},
        lineNumbers: {
            type: Boolean,
            required: false
        }
    },

    data() {
        return {
            jsonSource: '',
            jsonError: null
        };
    },

    mounted() {
        this.refreshSource();
    },

    watch: {
        value() {
            if (this.isSourceUpToDate()) {
                return;
            }
            this.refreshSource();
        },
    },

    methods: {

        isSourceUpToDate() {
            try {
                return JSON5.stringify(this.value) === JSON5.stringify(JSON5.parse(this.jsonSource));
            } catch (err) {
                return false;
            }
        },

        refreshSource() {
            this.jsonError = null;
            this.jsonSource = JSON5.stringify(this.value, {
                space: 2,
                quote: '\''
            });
        },

        onInput(value) {
            try {
                this.jsonError = null;
                this.jsonSource = value;
                const data = JSON5.parse(value);
                this.$emit('input', data);
                this.$emit('change');
            } catch (err) {
                this.jsonError = err;
            }
        }

    }

};
</script>
