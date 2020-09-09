<template>
    <div class="extensions">
        <dev-extensions v-if="isDevEnabled"/>
        <signin-warning class="ext-warning"
            message="to the Automation Cloud to browse and load Extensions"/>
        <extensions v-if="apiLogin.authorised"/>
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

    bind: {
        apiLogin: ApiLoginController,
        extDev: ExtensionDevController,
        extReg: ExtensionRegistryController,
    },

    components: {
        DevExtensions,
        Extensions,
    },

    computed: {
        script() {
            return this.app.project.script;
        },
        isDevEnabled() {
            return this.extDev.isDevEnabled();
        },
    },

};
</script>

<style scoped>
.ext-warning {
    margin: 0 var(--gap);
}
</style>
