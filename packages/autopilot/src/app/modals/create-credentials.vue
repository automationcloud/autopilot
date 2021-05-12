<template>
    <div class="modal modal--narrow">
        <div class="modal__header">
            <i v-if="param.icon"
                :class="param.icon"></i>
            <span>Log into {{ providerName }}</span>
        </div>
        <div class="modal__body">

            <div class="form-row">
                <div class="form-row__label">
                    Auth Type
                </div>

                <div class="form-row__controls">
                    <select class="select" v-model="selectedIndex">
                        <option v-for="(conf, index) of configs"
                            :key="index"
                            :value="index"
                            @click="selectedIndex = index">
                            <span v-if="conf.type === 'basic'">Basic</span>
                            <span v-if="conf.type === 'bearer'">Bearer</span>
                            <span v-if="conf.type === 'oauth1'">OAuth1</span>
                            <span v-if="conf.type === 'oauth2'">OAuth2</span>
                        </option>
                    </select>
                </div>
            </div>

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

            <div v-if="selectedConfig.type === 'oauth1'">
                <template v-if="selectedConfig.customConfig">
                    <div class="form-row">
                        <div class="form-row__label">
                            Request Token URL
                        </div>
                        <div class="form-row__controls">
                            <input
                                class="input stretch"
                                v-model.trim="oauth1.requestTokenUrl"/>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-row__label">
                            Access Token URL
                        </div>
                        <div class="form-row__controls">
                            <input
                                class="input stretch"
                                v-model.trim="oauth1.accessTokenUrl"/>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-row__label">
                            Authorization URL
                        </div>
                        <div class="form-row__controls">
                            <input
                                class="input stretch"
                                v-model.trim="oauth1.userAuthorizationUrl"/>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-row__label">
                            Signature Method
                        </div>
                        <div class="form-row__controls">
                            <select
                                class="input stretch"
                                v-model.trim="oauth1.signatureMethod">
                                <option value="HMAC-SHA1">HMAC-SHA1</option>
                                <option value="HMAC-SHA256">HMAC-SHA256</option>
                                <option value="RSA-SHA1">RSA-SHA1</option>
                                <option value="PLAINTEXT">Plain Text</option>
                            </select>
                        </div>
                    </div>
                </template>

                <div class="form-row">
                    <div class="form-row__label">
                        Consumer Key
                    </div>
                    <div class="form-row__controls">
                        <input
                            class="input stretch"
                            v-model.trim="oauth1.consumerKey"/>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-row__label">
                        Consumer Secret
                    </div>
                    <div class="form-row__controls">
                        <input type="password"
                            class="input stretch"
                            v-model.trim="oauth1.consumerSecret"/>
                    </div>
                </div>
                <div class="form-row"
                    v-if="oauth1.signatureMethod.includes('RSA')">
                    <div class="form-row__label">
                        Private Key
                    </div>
                    <div class="form-row__controls">
                        <input type="password"
                            class="input stretch"
                            v-model.trim="oauth1.privateKey"/>
                    </div>
                </div>
            </div>

            <div v-if="selectedConfig.type === 'oauth2'">
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
            </div>

            <div class="help box box--blue"
                v-if="selectedConfig.help"
                v-html="selectedConfig.help">
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
            oauth1: {
                consumerKey: '',
                consumerSecret: '',
                privateKey: '',
                // Those are only modified when `config.customConfig: true`
                requestTokenUrl: '',
                accessTokenUrl: '',
                userAuthorizationUrl: '',
                signatureMethod: 'HMAC-SHA1',
            },
            oauth2: {
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
        const oauth1Config = this.configs.find(_ => _.type === 'oauth1');
        if (oauth1Config) {
            this.oauth1.requestTokenUrl = oauth1Config.requestTokenUrl;
            this.oauth1.accessTokenUrl = oauth1Config.accessTokenUrl;
            this.oauth1.userAuthorizationUrl = oauth1Config.userAuthorizationUrl;
            this.oauth1.signatureMethod = oauth1Config.signatureMethod;
        }
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
                case 'oauth1':
                    return this.isFilled(this.oauth1, ['privateKey']);
                case 'oauth2':
                    return this.isFilled(this.oauth2);
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

        isFilled(obj, exceptKeys = []) {
            for (const [k, v] of Object.entries(obj)) {
                if (exceptKeys.includes(k)) {
                    continue;
                }
                if (!String(v || '').trim()) {
                    return false;
                }
            }
            return true;
        }

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
