<template>
    <div class="account-menu">
        <button v-if="!isAuthenticated"
            class="button button--small button--yellow frameless"
            @click="apiLogin.startLogin()">
            Sign in
        </button>
        <span v-else
            class="account-icon"
            @click="popupMenu"
            @contextmenu.stop.prevent="popupMenu">
            {{ text }}
        </span>
        <div class="account-menu-bubble" data-anchor="login"></div>
    </div>
</template>

<script>
import { menu } from '../util';

export default {

    inject: [
        'apiLogin'
    ],

    computed: {
        isAuthenticated() { return this.apiLogin.isAuthenticated(); },
        text() { return this.apiLogin.userInitial; },
    },

    methods: {

        popupMenu() {
            const email = this.apiLogin.account ? this.apiLogin.account.email : 'Offline User';
            const menuItems = [
                {
                    label: 'Email: ' + email,
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
                        this.apiLogin.invalidateTokens();
                    },
                }
            ];
            menu.popupMenu(menuItems);
        },
    },
}
</script>

<style scoped>
.account-menu {
    position: relative;
}

.account-menu-bubble {
    position: absolute;
    bottom: 0;
}
</style>
