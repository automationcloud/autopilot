<template>
    <div
        v-if="roxiBarShown"
        :title="sampleSuccess ? 'Roxi settings' : 'Roxi settings: No proxy for the selected tag'"
        class="group group--merged">
        <button class="button button--small button--flat"
            :class="{ 'button--primary': roxiEnabled }"
            @click="popup">
            <i class="button__icon fas fa-exchange-alt"></i>
            <span>{{ sampleSuccess ? roxiTag : 'No proxy' }}</span>
        </button>
    </div>
</template>

<script>
import { RoxiController, ApiLoginController } from '~/controllers';
import { popupMenu } from '../util/menu';
export default {

    computed: {
        roxi() {
            return this.get(RoxiController);
        },

        apiLogin() {
            return this.get(ApiLoginController);
        },

        roxiEnabled() {
            return this.roxi.isEnabled();
        },

        roxiTag() {
            return this.roxi.getSelectedTag();
        },

        roxiBarShown() {
            return this.roxi.isSecretConfigured() && this.apiLogin && this.apiLogin.isAuthenticated;
        },

        sampleSuccess() {
            return this.roxi.isSampleProxyFound();
        },
    },


    methods: {
        popup() {
            const menuItems = [
                {
                    label: 'Enabled',
                    type: 'checkbox',
                    checked: this.roxiEnabled,
                    click: () => {
                        this.roxi.setEnabled(!this.roxiEnabled);
                    }
                },
                { type: 'separator' }
            ];
            for (const tag of this.roxi.tags) {
                menuItems.push({
                    label: tag,
                    type: 'checkbox',
                    checked: this.roxiTag === tag,
                    click: () => {
                        this.roxi.toggleTag(tag);
                    }
                });
            }
            popupMenu(menuItems);
        },
    }
}
</script>
