<template>
    <div class="service-view section">
        <div class="service-view__header section__title">
            <button class="button button--icon frameless"
                data-selection-id="back"
                tabindex="0"
                v-focus
                title="Services list"
                @click="viewport.goToServices()"
                @uicollapse="viewport.goToServices()">
                <i class="fa fa-chevron-left"></i>
            </button>
            <div class="service-view__name">{{ service.name }}</div>
            <button class="button"
                @click="attributesModalShown = true">
                <i class="button__icon fas fa-cloud-upload-alt"></i>
                <span>Update attributes</span>
            </button>
            <button class="button button--primary"
                @click="newModalShown = true">
                <i class="button__icon fas fa-cloud-upload-alt"></i>
                <span>Upload new version</span>
            </button>
        </div>
        <script-list/>
        <script-update-service-attributes :shown="attributesModalShown"
            @close="attributesModalShown = false"/>
        <script-new :shown="newModalShown"
            @close="newModalShown = false"/>
    </div>
</template>

<script>
import ScriptList from './script-list.vue';
import ScriptNew from './script-new.vue';
import ScriptUpdateServiceAttributes from './script-update-service-attributes.vue';

export default {

    components: {
        ScriptList,
        ScriptNew,
        ScriptUpdateServiceAttributes,
    },

    data() {
        return {
            attributesModalShown: false,
            newModalShown: false
        };
    },

    computed: {
        viewport() { return this.app.viewports.api; },
        controller() { return this.viewport.services; },
        service() { return this.viewport.selectedService; },
    },

    methods: {
    }

};
</script>

<style>
.service-view {
    padding: 0 var(--gap);
}

.service-view__header {
    display: flex;
    align-items: center;
}

.service-view__name {
    margin-left: var(--gap--small);
    flex: 1;
}

.service-view button + button {
    margin-left: var(--gap--small);
}
</style>
