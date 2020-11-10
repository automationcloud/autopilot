<template>
    <div class="extensions">
        <dev-extensions v-if="isDevEnabled"/>
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
    ],

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
