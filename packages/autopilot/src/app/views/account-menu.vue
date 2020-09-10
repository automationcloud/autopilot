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
                @click="apiLogin.startLogin">
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

        text() { return this.apiLogin.userInitial; },

    },

    methods: {

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
