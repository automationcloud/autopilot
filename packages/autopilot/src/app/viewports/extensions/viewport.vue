<template>
    <div class="extensions">
        <signin-warning class="ext-warning"
            message="to the Automation Cloud to browse and load Extensions"/>
        <extensions v-if="apiLogin.isAuthenticated()"/>
    </div>
</template>

<script>
import Extensions from './extensions.vue';

export default {

    inject: [
        'apiLogin',
        'extReg',
    ],

    components: {
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
