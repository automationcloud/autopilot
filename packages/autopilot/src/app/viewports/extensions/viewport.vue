<template>
    <div class="extensions">
        <dev-extensions v-if="devMode.isEnabled()"/>
        <signin-warning class="ext-warning"
            message="to the Automation Cloud to browse and load Extensions"/>
        <extensions v-if="apiLogin.isAuthenticated()"/>
    </div>
</template>

<script>
import DevExtensions from './dev-extensions.vue';
import Extensions from './extensions.vue';

export default {

    inject: [
        'apiLogin',
        'extDev',
        'extReg',
        'devMode',
    ],

    components: {
        DevExtensions,
        Extensions,
    },

    computed: {
        script() {
            return this.app.project.script;
        },
    },

};
</script>

<style scoped>
.viewport--active .extensions {
    background: var(--color-cool--100);
}

.ext-warning {
    margin: 0 var(--gap);
}
</style>
