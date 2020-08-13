<template>
    <div class="output-preview">

        <template v-if="data !== undefined">
            <explore :data="{ output: data }"/>
        </template>

        <div class="callout"
            v-else>
            Output preview is unavailable.
        </div>

        <div class="box box--green"
            v-if="domain && valid">
            Output is valid according to <strong>{{ domain.id }}.{{ defKey }}</strong>
        </div>

        <div class="box box--red"
             v-else>
            <validation-error
                v-for="(err, i) of errors"
                :error="err"
                :key="i"/>
        </div>

    </div>
</template>

<script>
export default {

    props: {
        defKey: { type: String, required: true },
        data: {}
    },

    data() {
        return {
            copied: false,
            valid: false,
            errors: null
        };
    },

    computed: {

        domain() {
            return this.app.tools.getDomain();
        },

    },

    mounted() {
        this.validate();
    },

    watch: {
        defKey: 'validate',
        data: 'validate',
        domain: 'validate'
    },

    methods: {

        async validate() {
            if (!this.domain) {
                return;
            }
            const { valid, errors } = await this.domain.validateOutput(this.defKey, this.data);
            this.valid = valid;
            this.errors = errors;
        },

    }

};
</script>

<style>
.output-preview__validation-error {
    margin: var(--gap--small) 0;
}
</style>
