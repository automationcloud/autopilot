<template>
    <div class="signin-warning automation-cloud">

        <template v-if="!loggingIn">
            <div class="box">
                <i class="fas fa-exclamation-circle"></i>
                <span>You need to be signed-in {{ message }}.</span>
            </div>

            <div style="margin-top: var(--gap);">
                <button
                    class="button button--yellow"
                    type="click"
                    @click="$emit('signin');">
                    <i class="fas fa-angle-right button__icon"></i>
                    <span>Sign-in</span>
                </button>
            </div>
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

.box {
    margin: var(--gap--large) 0;
    font-size: inherit;
    background-color: var(--color-yellow--300);
    vertical-align: middle;
    display: flex;
    align-items: center;
}

.box i {
    font-size: 1.4em;
    margin-right: var(--gap);
}
</style>
