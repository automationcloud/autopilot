<template>
    <div class="extensions">
        <error v-if="extReg.error"
            :err="extReg.error"/>
        <template v-else>
            <div class="section"
                v-if="extReg.installedManifests.length">
                <div class="section__subtitle">
                    Installed ({{ extReg.installedManifests.length }})
                </div>
                <ext-item
                    v-for="manifest in extReg.installedManifests"
                    :key="manifest.id"
                    :manifest="manifest"
                    :installed="true"/>
            </div>
            <div class="section"
                v-if="extReg.availableManifests.length">
                <div class="section__subtitle">
                    Available ({{ extReg.availableManifests.length }})
                </div>
                <ext-item
                    v-for="manifest in extReg.availableManifests"
                    :key="manifest.id"
                    :manifest="manifest"
                    :installed="false"/>
            </div>
        </template>
    </div>
</template>

<script>
import { ExtensionRegistryController } from '~/controllers';
import ExtItem from './ext-item.vue';

export default {

    components: {
        ExtItem,
    },

    data() {
        return {
            adding: false,
        };
    },

    computed: {
        script() { return this.app.project.script; },
        extReg() { return this.get(ExtensionRegistryController); },
    },

};
</script>

<style scoped>
.section {
    padding: var(--gap);
}

.title {
    display: flex;
    align-items: center;
}
</style>
