<template>
    <div class="signin-warning automation-cloud"
        v-if="isShown">

        <div class="box box--primary"
            style="display: flex; align-items: center;">
            <i class="fas fa-exclamation-circle"></i>
            <span>You need to be signed in {{ message }}.</span>
        </div>

        <button
            class="button button--primary button--cta"
            type="click"
            @click="apiLogin.startLogin()">
            <span>Sign in</span>
        </button>

        <a
            class="button button--tertiary button--cta"
            type="click"
            :href="registerUrl">
            <span>Sign up for an account</span>
        </a>
    </div>
</template>

<script>
export default {

    inject: [
        'apiLogin',
        'settings'
    ],

    props: {
        message: { type: String, default: '' },
    },

    computed: {
        isShown() {
            return this.app.initialized &&
                !this.apiLogin.isAuthenticated();
        },
        registerUrl() {
            return this.settings.getAcLink('register');
        }
    },

};

</script>

<style scoped>
.signin-warning {
    color: var(--color-cool--800);
    font-size: 1.2em;
}

.box {
    margin: var(--gap) 0;
}
</style>
