<template>
    <div class="signin-warning">

        <template v-if="!loggingIn">
            <div class="box">
                <i class="fas fa-exclamation-circle"></i>
                <span>You need to be signed-in {{ message }}</span>
            </div>

            <div style="margin-top: var(--gap);">
                <button
                    class="button button--yellow frameless"
                    type="click"
                    @click="$emit('signIn');">
                    <i class="fas fa-chevron-right button__icon"></i>
                    <span>Sign in</span>
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
}
</script>

<style scoped>
.signin-warning {
    margin: var(--gap);
}

.box {
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
