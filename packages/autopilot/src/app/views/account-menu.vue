<template>
    <div class="account-menu">
        <template v-if="loggingIn">
            <button
                class="button button--small button--yellow frameless"
                disabled>
                Signing in...
            </button>
        </template>
        <template v-else>
            <button v-if="!authorised"
                class="button button--small button--yellow frameless"
                @click="signIn">
                Sign in
            </button>
            <span v-else
                class="badge badge--round badge--circle"
                @click="popupMenu"
                @contextmenu.stop.prevent="popupMenu">
                {{ text }}
            </span>
        </template>
    </div>
</template>

<script>
import { menu } from '../util';

export default {

    inject: [
        'apiLogin'
    ],

    computed: {

        authorised() { return this.apiLogin.authorised; },

        loggingIn() { return this.apiLogin.loggingIn; },

        text() {
            if (!this.apiLogin.account) {
                return 'USER';
            }
            const { firstName, lastName, email } = this.apiLogin.account;
            const i1 = firstName[0] || null;
            const i2 = lastName[0] || null;
            return i1 && i2 ? i1 + i2 : email.substring(0, 2);
        },

    },

    methods: {

        signIn() {
            this.apiLogin.startLogin();
        },

        popupMenu() {
            const menuItems = [
                {
                    label: 'Email: ' + this.apiLogin.account.email,
                    enabled: false,
                },
                {
                    type: 'separator',
                },
                {
                    label: 'Manage your account',
                    click: () => {
                        this.apiLogin.manageAccount();
                    },
                },
                {
                    label: 'Sign out',
                    click: () => {
                        this.apiLogin.logout();
                    },
                }
            ];

            menu.popupMenu(menuItems);
        },
    },
}
</script>

<style scoped>
.badge {
    background: var(--color-yellow--300);
    color: var(--ui-color);
    height: 2em;
}

.badge--circle {
    text-transform: uppercase;
    height: 2.2em;
    width: 2.2em;
    letter-spacing: 0;
}
</style>
