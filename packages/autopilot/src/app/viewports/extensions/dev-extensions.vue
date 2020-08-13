<template>
    <div class="local-extensions section">

        <div class="title">
            <div style="flex: 1"
                class="section__subtitle">
                Local extensions
            </div>
            <button class="button button--primary button--small"
                @click="addExtension()">
                <span>Add directory</span>
            </button>
        </div>

        <div v-for="ext in extensions"
            class="extension-item">
            <section>
                <div class="extension-name">
                    {{ ext.spec.name }}:{{ ext.spec.version }}
                </div>
                <div class="extension-dir">
                    {{ ext.dir }}
                </div>
            </section>
            <div class="extension-controls">
                <button class="button button--primary button--small"
                    title="Publish extension"
                    @click="publishExtension(ext)"
                    :disabled="isPublishDisabled(ext)">
                    <template v-if="processing === ext">
                        Publishing...
                    </template>
                    <template v-else>
                        Publish {{ ext.spec.version }}
                    </template>
                </button>
                <button class="button button--secondary button--small button--icon"
                    title="Remove extension"
                    @click="removeExtension(ext)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { ExtensionDevController, ExtensionRegistryController } from '~/controllers';

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

        devExt() {
            return this.get(ExtensionDevController);
        },

        extRegistry() {
            return this.get(ExtensionRegistryController);
        },

        extensions() {
            return this.devExt.extensions;
        },

        processing() {
            return this.devExt.processing;
        },

    },

    methods: {

        async addExtension() {
            await this.devExt.showAddExtensionPopup();
        },

        async removeExtension(ext) {
            await this.devExt.removeExtension(ext);
        },

        async publishExtension(ext) {
            await this.devExt.publishExtension(ext);
        },

        isPublishDisabled(ext) {
            return this.project || this.isExtensionPublished(ext);
        },

        isExtensionPublished(ext) {
            return this.extRegistry.isVersionExist(ext.spec.name, ext.spec.version);
        },

    }

};
</script>

<style scoped>
.local-extensions {
    padding: var(--gap);
    background: var(--color-cool--200);
}

.title {
    display: flex;
    align-items: center;
}

.extension-item {
    display: flex;
    align-items: center;
    padding: var(--gap--small) var(--gap);
    margin: 0 calc(-1 * var(--gap));
}

.extension-item:hover {
    background: rgba(0,0,0,.05);
}

.extension-item section {
    flex: 1;
}

.extension-dir {
    font-size: var(--font-size--small);
    color: var(--color-cool--500);
}

.extension-controls {
    white-space: nowrap;
}
</style>
