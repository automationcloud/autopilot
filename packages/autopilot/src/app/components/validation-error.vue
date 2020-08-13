<template>
    <div class="validation-error">
        <div class="validation-error__title">
            <strong>{{ error.key || error.dataPath }}</strong>
            <span>{{ error.message }}</span>
        </div>
        <div class="validation-error__params">
            <span class="validation-error__param">{{ params.additionalProperty }}</span>
            <span class="validation-error__param">{{ params.allowedValues }}</span>
        </div>
    </div>
</template>

<script>
export default {

    props: {
        error: { type: Object, required: true }
    },

    computed: {
        params() {
            return this.error.params || {};
        }
    }

};
</script>

<style>
.validation-error {
    background: var(--color-red--100);
    padding: var(--gap--small);
}

.validation-error__title {
    color: var(--color-red--500);
}

.validation-error__params {
    padding-left: var(--gap);
    font-style: italic;
    color: var(--color-cool--500);
}
</style>
