<template>
    <div class="api">
        <div class="api__error"
            v-if="apiLogin.authorised && viewport.error">
            <error :err="viewport.error"
                :allow-dismiss="true"
                @dismiss="viewport.dismissError()"/>
        </div>

        <loaded-info/>
        <signin-warning
            v-if="!apiLogin.authorised"
            :message="signinMessage"
            :loggingIn="apiLogin.loggingIn"
            @signIn="signIn" />
        <!-- v-if="viewport.error.message === 'AuthorizationError'"-->
        <div v-else>
            <service-list v-if="!this.viewport.selectedService"/>
            <template v-else>
                <service-view v-if="!this.viewport.selectedJob"/>
            </template>
        </div>
    </div>
</template>

<script>
import ServiceList from './service-list.vue';
import ServiceView from './service-view.vue';
import LoadedInfo from './loaded-info.vue';

export default {

    components: {
        ServiceList,
        ServiceView,
        LoadedInfo,
    },

    data() {
        return {
            signinMessage: 'to access Services and run automations on the Automation Cloud',
        }
    },

    computed: {
        viewport() { return this.app.viewports.api; },
        apiLogin() { return this.viewport.apiLogin; },
    },

    methods: {
        signIn() {
            this.viewport.apiLogin.startLogin();
        },
    }

};
</script>

<style>
.api {

}
</style>
