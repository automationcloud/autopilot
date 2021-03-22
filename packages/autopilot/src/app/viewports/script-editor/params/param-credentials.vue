<template>
    <div class="param--credentials">
        <div class="param__field">
            <div class="param__label">
                {{ label }}
            </div>
            <div class="param__controls">

                <div class="group group--gap stretch">
                    <select
                        class="input stretch"
                        v-model="value">
                        <option label="- New login -"
                            :value="null">
                        </option>
                        <optgroup label="Existing logins"
                            v-if="availableCreds.length">
                            <option v-for="cred of availableCreds"
                                :key="cred.id"
                                :value="cred">
                                {{ cred.name }}
                                ({{ new Date(cred.updatedAt).toLocaleString() }})
                            </option>
                        </optgroup>
                    </select>

                    <button v-if="!value"
                        @click="login()"
                        class="button button--primary button--icon"
                        title="Log in">
                        <i class="fas fa-sign-in-alt"></i>
                    </button>

                    <button v-if="value"
                        @click="logout()"
                        class="button button--tertiary button--icon"
                        title="Log out">
                        <i class="fas fa-times"></i>
                    </button>

                </div>
            </div>
        </div>
    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    inject: [
        'credentials'
    ],

    mixins: [ParamMixin],

    computed: {

        availableCreds() {
            return this.credentials.availableCredentials
                .filter(_ => _.providerName === this.param.providerName);
        }

    },

    methods: {

        login() {
            this.credentials.showLoginDialog(this.itemProxy, this.param);
        },

        logout() {
            this.credentials.logout(this.itemProxy, this.param);
        },

    }

};
</script>

<style scoped>
.login-details {
    text-align: right;
}

.login-options {
    margin: var(--gap) 0;
}
</style>
