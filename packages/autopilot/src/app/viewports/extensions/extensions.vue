<template>
    <div class="extensions">
        <error v-if="extReg.error"
            :err="extReg.error"/>
        <template v-else>
             <div class="nav-panel group group--merged">
                <button v-for="cat of ['extension', 'connector']"
                    :key="cat"
                    class="button"
                    :class="{
                        'button--accent': cat === extReg.filterCategory,
                        'button--secondary': cat !== extReg.filterCategory,
                    }"
                    @click="extReg.filterCategory = cat">
                    <span class="stretch">{{ toHumanLabel(cat) }}</span>
                </button>
            </div>
            <div class="ext-search">
                <span class="icon">
                    <i class="fas fa-search"></i>
                </span>
                <div class="input stretch ext-search-input">
                    <input v-model="extReg.searchQuery"
                        placeholder="Search" />
                </div>

                <button class="button button--primary button--icon"
                    @click="refresh()">
                    <i class="fas fa-spinner fa-spin" v-if="loading"></i>
                    <i class="fas fa-sync-alt" v-else></i>
                </button>
            </div>
            <div class="section" v-if="devMode.isEnabled()">
                <div class="section__title">
                    <span @click="expandable.toggleExpand('dev-extensions')">
                        Local {{ currentCategory }} ({{ devExtensions.length }})
                    </span>
                    <expand id="dev-extensions"/>
                </div>
                <template v-if="expandable.isExpanded('dev-extensions')">
                    <button class="button button--alt button--cta button--tertiary ext-dev-install"
                        @click="addDevExtension()">
                        New watched folder
                    </button>
                    <div v-if="devExtensions.length === 0"
                        class="ext-list--empty">
                        No Local {{ currentCategory }} {{ searchEnabled ? ' match your search criteria' : '' }}
                    </div>
                    <div class="ext-list">
                        <ext-item
                            v-for="manifest in devExtensions"
                            :key="manifest.name"
                            :manifest="manifest"
                            :installed="true"
                            :isDev="true"/>
                    </div>
                </template>
            </div>
            <div class="section">
                <div class="section__title">
                    <span @click="expandable.toggleExpand('ext-installed')">
                        Installed {{ currentCategory }} ({{ extReg.installedManifests.length }})
                    </span>
                    <expand v-if="extReg.installedManifests.length" id="ext-installed"/>
                </div>
                <div v-if="extReg.installedManifests.length === 0"
                    class="ext-list--empty">
                    No installed {{ currentCategory }} {{ searchEnabled ? ' match your search criteria' : '' }}
                </div>
                <div v-if="expandable.isExpanded('ext-installed')"
                    class="ext-list">
                    <ext-item
                        v-for="manifest in extReg.installedManifests"
                        :key="manifest.id"
                        :manifest="manifest"
                        :installed="true"/>
                </div>
            </div>
            <div class="section">
                <div class="section__title">
                    <span @click="expandable.toggleExpand('ext-available')">
                    Available ({{ extReg.availableManifests.length }})
                    </span>
                    <!-- <expand id="ext-available"/> -->
                </div>
                <!-- <template v-if="expandable.isExpanded('ext-available')"> -->

                <div v-if="extReg.availableManifests.length === 0"
                    class="ext-list--empty">
                    No available {{ currentCategory }} {{ searchEnabled ? ' match your search criteria' : ''}}
                </div>
                <div class="ext-list">
                    <ext-item
                        v-for="manifest in extReg.availableManifests"
                        :key="manifest.id"
                        :manifest="manifest"
                        :installed="false"/>
                <!-- </template> -->
                </div>
                <request-connector v-if="this.extReg.filterCategory === 'connector'" />
            </div>
        </template>
    </div>
</template>

<script>
import ExtItem from './ext-item.vue';
import RequestConnector from './request-connector.vue';

export default {
    inject: [
        'project',
        'expandable',
        'extReg',
        'extDev',
        'devMode',
    ],

    components: {
        ExtItem,
        RequestConnector,
    },

    data() {
        return {
            adding: false,
        };
    },

    computed: {
        script() { return this.project.script; },
        loading() { return this.extReg.loading; },
        searchEnabled() { return !!this.extReg.searchQuery; },
        currentCategory() { return this.toHumanLabel(this.extReg.filterCategory); },
        devExtensions() {
            return this.extDev.availableExtensions(this.extReg.filterCategory, this.extReg.searchQuery);
        },
    },

    methods: {
        refresh() {
            this.extReg.refresh();
        },

        toHumanLabel(category) {
            return {
                extension: 'Extensions',
                connector: 'API Connectors',
            }[category];
        },

        async addDevExtension() {
            await this.extDev.showAddExtensionPopup();
            this.expandable.expand(this.expandId);
        },

        async removeDevExtension(ext) {
            await this.extDev.removeExtension(ext);
        },

    }

};
</script>

<style scoped>
.extensions {
    font-family: var(--font-family--alt);
    font-size: var(--font-size--alt);
}

.nav-panel {
    margin: var(--gap);
    display: grid;
    grid-template-columns: 1fr 1fr;
    height: 25px;
    justify-items: stretch;
    background: white;
}

.nav-panel .button {
    height: 100%;
    font-family: inherit;
    font-size: 1em;
}

.section {
    margin: var(--gap);
}

.ext-search {
    margin: var(--gap--large) var(--gap);
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-between;
}

.ext-search-input {
    margin-right: var(--gap--small);
}

.ext-list {
    box-shadow: 0 1px 3px rgba(0,0,0,.2);
    border-radius: var(--border-radius);
    margin: var(--gap) 0;
}

.ext-list--empty {
    padding-bottom: var(--gap--large);
    font-size: var(--font-size);
}

.ext-dev-install {
    padding: 0;
    margin-top: -10px;
}
</style>
