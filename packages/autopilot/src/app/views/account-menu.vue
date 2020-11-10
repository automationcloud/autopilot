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
</style>
