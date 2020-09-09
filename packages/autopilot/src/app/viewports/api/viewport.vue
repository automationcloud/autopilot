<template>
    <div class="api">
        <div class="api__error"
            v-if="apiLogin.authorised && viewport.error">
            <error :err="viewport.error"
                :allow-dismiss="true"
                @dismiss="viewport.dismissError()"/>
        </div>

        <loaded-info/>
        <signin-warning message="to access Services and run automations on the Automation Cloud"/>
        <template v-if="apiLogin.authorised">
            <service-list v-if="!this.viewport.selectedService"/>
            <template v-else>
                <service-view v-if="!this.viewport.selectedJob"/>
            </template>
        </template>
    </div>
</template>

<script>
import { ApiLoginController } from '~/controllers';
import ServiceList from './service-list.vue';
import ServiceView from './service-view.vue';
import LoadedInfo from './loaded-info.vue';

export default {

    bind: {
        apiLogin: ApiLoginController,
    },

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
