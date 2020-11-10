<template>
    <div class="api">
        <signin-warning class="signin-warning"
            message="to access Services and run automations on the Automation Cloud"/>
        <template v-if="apiLogin.isAuthenticated()">
            <div class="api__error"
                v-if="apiLogin.isAuthenticated() && viewport.error">
                <error :err="viewport.error"
                    :allow-dismiss="true"
                    @dismiss="viewport.dismissError()"/>
            </div>

            <loaded-info/>
            <service-list v-if="!this.viewport.selectedService"/>
            <template v-else>
                <service-view v-if="!this.viewport.selectedJob"/>
            </template>
        </template>
    </div>
</template>

<script>
import ServiceList from './service-list.vue';
import ServiceView from './service-view.vue';
import LoadedInfo from './loaded-info.vue';

export default {

    inject: [
        'apiLogin'
    ],

    components: {
        ServiceList,
        ServiceView,
        LoadedInfo,
    },

    computed: {
        viewport() { return this.app.viewports.api; },
    },

};
</script>

<style scoped>
.signin-warning {
    padding: 0 var(--gap);
}
</style>
