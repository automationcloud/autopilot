<template>
    <div class="signin-warning automation-cloud">

        <template v-if="!loggingIn">
            <div class="box box--primary" style="display: flex; align-items: center;">
                <i class="fas fa-exclamation-circle"></i>
                <span>You need to be signed-in {{ message }}.</span>
            </div>

            <button
                class="button button--yellow"
                type="click"
                @click="$emit('signin');">
                <span>Sign-in</span>
            </button>
        </template>
    </div>
</template>

<script>
export default {
    props: {
        message: { type: String, default: '' },
        loggingIn: { type: Boolean, required: true },
    },

    methods: {
    },
};

</script>

<style scoped>
.signin-warning {
    margin: var(--gap);
    color: var(--color-cool--800);
    font-size: 1.2em;
}
</style>
