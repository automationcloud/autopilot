<template>
    <div class="installed-extensions">

        <error v-if="extRegistry.error"
            :err="extRegistry.error"/>

        <div v-else
            class="content">

            <div v-for="manifest in availableExtensions"
                class="extension-item">
                <section style="flex: 1">
                    <div class="extension-name">
                        {{ manifest.name }}:{{ manifest.latestVersion }}
                    </div>
                    <div class="extension-description">
                        {{ manifest.description }}
                    </div>
                </section>
                <aside>
                    <template v-if="isInstalled(manifest)">
                        <button v-if="isOutdated(manifest)"
                            class="button button--secondary button--small"
                            @click="update(manifest)">
                            <span>Update</span>
                        </button>
                        <button v-else
                            class="button button--secondary button--small"
                            disabled>
                            <span>Installed</span>
                        </button>
                        <button class="button button--secondary button--small button--icon"
                            @click="uninstall(manifest)">
                            <i class="fas fa-trash"></i>
                        </button>
                    </template>
                    <template v-else>
                        <button class="button button--primary button--small"
                            @click="install(manifest)">
                            <span>Install</span>
                        </button>
                    </template>
                </aside>
            </div>
        </div>

    </div>
</template>

<script>
import { ExtensionRegistryController } from '~/controllers';

export default {

    data() {
        return {
            adding: false,
        };
    },

    computed: {

        script() {
            return this.app.project.script;
        },

        extRegistry() {
            return this.get(ExtensionRegistryController);
        },

        availableExtensions() {
            return this.extRegistry.availableExtensions;
        },

    },

    methods: {

        isInstalled(manifest) {
            return this.extRegistry.getInstalledVersion(manifest) != null;
        },

        isOutdated(manifest) {
            return this.extRegistry.isOutdated(manifest);
        },

        refresh() {
            this.extRegistry.fetchAvailableExtensions();
        },

        update(manifest) {
            this.extRegistry.updateExtension(manifest);
        },

        install(manifest) {
            this.extRegistry.installExtension(manifest);
        },

        uninstall(manifest) {
            this.extRegistry.uninstallExtension(manifest);
        },

    }

};
</script>

<style scoped>
.content {
    padding: var(--gap);
}

.title {
    display: flex;
    align-items: center;
}

.extension-item {
    margin: 0 calc(-1 * var(--gap));
    padding: var(--gap);
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
}

.extension-item:hover {
    background: rgba(0,0,0,.05);
}

.extension-name {
    font-weight: bold;
    margin: var(--gap--small) 0;
}

.extension-description {
    color: var(--color-cool--600);
}
</style>
