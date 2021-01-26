<template>
    <div class="signin-warning"
        v-if="isShown">

        <div class="box box--primary group group--gap">
            <i class="box__icon fas fa-exclamation-circle"></i>
            <span>You need to be signed in {{ message }}.</span>
        </div>

        <div class="group group--gap">
            <button
                class="button button--alt button--primary button--cta"
                type="click"
                @click="apiLogin.startLogin()">
                <span>Sign in</span>
            </button>

            <button
                class="button button--alt button--tertiary button--cta"
                type="click"
                :href="registerUrl">
                <span>Sign up for an account</span>
            </button>
        </div>
    </div>
</template>

<script>
import { acUrls } from '../util';

export default {

    inject: [
        'apiLogin',
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
            return acUrls.get('register');
        }
    },

};

</script>
