<template>
    <div class="extensions">
        <error v-if="extReg.error"
            :err="extReg.error"/>
        <template v-else>
            <div class="ext-search">
                <div class="input stretch">
                    <span class="icon color--muted">
                        <i class="fas fa-search"></i>
                    </span>
                    <input v-model="extReg.searchQuery"/>
                </div>
            </div>
            <div class="section"
                v-if="extReg.installedManifests.length">
                <div class="section__subtitle">
                    <span @click="expandable.toggleExpand('ext-installed')">
                        Installed ({{ extReg.installedManifests.length }})
                    </span>
                    <expand id="ext-installed"/>
                </div>
                <template v-if="expandable.isExpanded('ext-installed')">
                    <ext-item
                        v-for="manifest in extReg.installedManifests"
                        :key="manifest.id"
                        :manifest="manifest"
                        :installed="true"/>
                </template>
            </div>
            <div class="section"
                v-if="extReg.availableManifests.length">
                <div class="section__subtitle">
                    <span @click="expandable.toggleExpand('ext-available')">
                    Available ({{ extReg.availableManifests.length }})
                    </span>
                    <!-- <expand id="ext-available"/> -->
                </div>
                <!-- <template v-if="expandable.isExpanded('ext-available')"> -->
                    <ext-item
                        v-for="manifest in extReg.availableManifests"
                        :key="manifest.id"
                        :manifest="manifest"
                        :installed="false"/>
                <!-- </template> -->
            </div>
        </template>
    </div>
</template>

<script>
import ExtItem from './ext-item.vue';

export default {
    inject: [
        'project',
        'expandable',
        'extReg',
    ],

    components: {
        ExtItem,
    },

    data() {
        return {
            adding: false,
        };
    },

    computed: {
        script() { return this.project.script; },
    },

};
</script>

<style scoped>
.section {
    margin: var(--gap);
}

.ext-search {
    margin: var(--gap);
}
</style>
