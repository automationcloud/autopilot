<template>
    <div class="modal modal--narrow">
        <div class="modal__header">
            <i v-if="param.icon"
                :class="param.icon"></i>
            <span>Log into {{ providerName }}</span>
        </div>
        <div class="modal__body">

            <template v-if="configs.length > 1">
                <div class="nav-panel">
                    <div class="group group--semi-merged">
                        <button v-for="(conf, index) of configs"
                            :key="index"
                            class="button"
                            :class="{
                                'button--accent': index === selectedIndex,
                            }"
                            @click="selectedIndex = index">
                            <span v-if="conf.type === 'basic'">Basic</span>
                            <span v-if="conf.type === 'bearer'">Bearer</span>
                            <span v-if="conf.type === 'oauth2'">OAuth2</span>
                        </button>
                    </div>
                </div>
            </template>

            <div class="form-row">
                <div class="form-row__label">
                    Login name
                </div>
                <div class="form-row__controls">
                    <input v-focus
                        class="input stretch"
                        v-model.trim="name"
                        placeholder=""/>
                </div>
            </div>

            <div v-if="selectedConfig.type === 'basic'">
                <div class="form-row">
                    <div class="form-row__label">
                        {{ selectedConfig.usernameLabel || 'Username' }}
                    </div>
                    <div class="form-row__controls">
                        <input
                            class="input stretch"
                            v-model.trim="basic.username"/>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-row__label">
                        {{ selectedConfig.passwordLabel || 'Password' }}
                    </div>
                    <div class="form-row__controls">
                        <input type="password"
                            class="input stretch"
                            v-model.trim="basic.password"/>
                    </div>
                </div>
            </div>

            <div v-if="selectedConfig.type === 'bearer'">
                <div class="form-row">
                    <div class="form-row__label">
                        {{ selectedConfig.tokenLabel || 'Token' }}
                    </div>
                    <div class="form-row__controls">
                        <input class="input stretch"
                            v-model.trim="bearer.token"/>
                    </div>
                </div>
            </div>

            <div v-if="selectedConfig.type === 'oauth2'">
                <!--
                <div class="form-row">
                    <div class="form-row__label">
                        Grant Type
                    </div>
                    <div class="form-row__controls">
                        <select v-model="oauth2.grantType"
                            class="input stretch">
                            <option v-for="gt of selectedConfig.grantTypes"
                                :key="gt"
                                :value="gt">
                                {{ toHumanLabel(gt) }}
                            </option>
                        </select>
                    </div>
                </div>
                -->
                <template v-if="selectedConfig.customConfig">
                    <div class="form-row">
                        <div class="form-row__label">
                            Authorization URL
                        </div>
                        <div class="form-row__controls">
                            <input
                                class="input stretch"
                                v-model.trim="oauth2.authorizationUrl"/>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-row__label">
                            Token URL
                        </div>
                        <div class="form-row__controls">
                            <input
                                class="input stretch"
                                v-model.trim="oauth2.tokenUrl"/>
                        </div>
                    </div>
                </template>
                <div class="form-row">
                    <div class="form-row__label">
                        Client Id
                    </div>
                    <div class="form-row__controls">
                        <input
                            class="input stretch"
                            v-model.trim="oauth2.clientId"/>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-row__label">
                        Client Secret
                    </div>
                    <div class="form-row__controls">
                        <input type="password"
                            class="input stretch"
                            v-model.trim="oauth2.clientSecret"/>
                    </div>
                </div>

                <!-- Display additional help box, if custom one is not provided -->
                <div class="help box box--blue"
                    v-if="oauth2.grantType === 'authorization_code' && !selectedConfig.help">
                    Set the following Authorization Redirect URL in your app settings:<br/>
                    <b>https://connectors.automation.cloud/</b>
                </div>
            </div>

            <div class="help box box--blue"
                v-if="selectedConfig.help">
                {{ selectedConfig.help }}
            </div>

            <signin-warning
                style="margin-bottom: var(--gap)"
                message="to store the credentials securely"/>

        </div>

        <div class="modal__buttons"
            v-if="apiLogin.isAuthenticated()">
            <button class="button button--alt button--primary"
                @click="login()"
                :disabled="!canLogin">
                Login
            </button>
        </div>

    </div>
</template>

<script>
import { util } from '@automationcloud/engine';

export default {

    inject: [
        'credentials',
        'apiLogin',
    ],

    data() {
        return {
            name: '',
            selectedIndex: 0,
            basic: {
                username: '',
                password: '',
            },
            bearer: {
                token: '',
            },
            oauth2: {
                grantType: 'authorization_code',
                clientId: '',
                clientSecret: '',
                // Those are only modified when `config.customConfig: true`
                authorizationUrl: '',
                tokenUrl: '',
            },
        };
    },

    mounted() {
        // Infer login name from AC auth
        const { firstName } = this.apiLogin.account || {};
        this.name = firstName;
        // Pre-fill custom URLs for OAuth configs
        // TODO oauth1
        // const oauth1Config = this.configs.find(_ => _.type === 'oauth1');
        const oauth2Config = this.configs.find(_ => _.type === 'oauth2');
        if (oauth2Config) {
            this.oauth2.tokenUrl = oauth2Config.tokenUrl;
            this.oauth2.authorizationUrl = oauth2Config.authorizationUrl;
        }
    },

    computed: {

        param() {
            return this.credentials.param;
        },

        configs() {
            return this.param.configs;
        },

        providerName() {
            return this.param.providerName;
        },

        selectedConfig() {
            return this.configs[this.selectedIndex];
        },

        canLogin() {
            switch (this.selectedConfig.type) {
                case 'basic':
                    return this.basic.username || this.basic.password;
                case 'bearer':
                    return this.bearer.token;
                case 'oauth2':
                    return this.oauth2.clientId && this.oauth2.clientSecret;
                default:
                    return false;
            }
        },

    },

    methods: {

        toHumanLabel(gt) {
            return util.humanize(gt);
        },

        login() {
            const config = this.selectedConfig;
            this.credentials.login({
                name: this.name,
                config,
                data: this[config.type],
            });
        },

    }

};
</script>

<style scope>
.nav-panel {
    display: flex;
    justify-content: center;
    margin: var(--gap) 0 var(--gap--large);
}

.help {
    margin: 0;
}
</style>
