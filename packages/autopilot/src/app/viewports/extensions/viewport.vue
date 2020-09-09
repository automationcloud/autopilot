<template>
    <div class="extensions">
        <dev-extensions v-if="isDevEnabled"/>

        <signin-warning
            v-if="!apiLogin.authorised"
            message="to the Automation Cloud to browse and load Extensions."
            :loggingIn="apiLogin.loggingIn"
            @signin="apiLogin.startLogin()" />

        <template v-else>
            <extensions/>
        </template>
    </div>
</template>

<script>
import {
    ExtensionDevController,
    ExtensionRegistryController,
    ApiLoginController
} from '~/controllers';
import DevExtensions from './dev-extensions.vue';
import Extensions from './extensions.vue';

export default {

    components: {
        DevExtensions,
        Extensions,
    },

    computed: {

        script() {
            return this.app.project.script;
        },

        isDevEnabled() {
            return this.get(ExtensionDevController).isDevEnabled();
        },

        apiLogin() {
            return this.get(ApiLoginController);
        },

        extRegistry() {
            return this.get(ExtensionRegistryController);
        },

    },

    methods: {

    }

};
</script>

<style>
.extensions {

}
</style>
