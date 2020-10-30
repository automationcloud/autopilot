<template>
    <div class="local-extensions section">

        <div class="title">
            <div style="flex: 1"
                class="section__subtitle">
                <span @click="toggleExpanded">Local extensions</span>
                <expand :id="expandId"/>
            </div>
            <template v-if="expanded">
                <button class="button button--primary"
                    @click="addExtension()">
                    <span>Add directory</span>
                </button>
            </template>
        </div>

        <template v-if="expanded">
            <div v-for="ext in extensions"
                class="ext-item">
                <section>
                    <div class="ext-name">
                        {{ ext.spec.name }}:{{ ext.spec.version }}
                    </div>
                    <div class="ext-dir">
                        {{ ext.dir }}
                    </div>
                </section>
                <div class="ext-controls">
                    <span v-if="isExtensionPublished(ext)"
                        class="ext-published">
                        published
                    </span>
                    <button v-else
                        class="button button--primary"
                        title="Publish extension"
                        @click="publishExtension(ext)">
                        <template v-if="processing === ext">
                            Publishing...
                        </template>
                        <template v-else>
                            Publish {{ ext.spec.version }}
                        </template>
                    </button>
                    <button class="button button--secondary button--icon"
                        title="Remove extension"
                        @click="removeExtension(ext)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </template>

    </div>
</template>

<script>
import {
    ExtensionDevController,
    ExtensionRegistryController,
    ExpandableController,
} from '~/controllers';

export default {

    inject: [
        'expandable',
        'extDev',
        'extReg',
    ],

    data() {
        return {
            adding: false,
        };
    },

    computed: {

        expandId() {
            return 'dev-extensions';
        },

        script() {
            return this.app.project.script;
        },

        extensions() {
            return this.extDev.extensions;
        },

        processing() {
            return this.extDev.processing;
        },

        expanded() {
            return this.expandable.isExpanded(this.expandId);
        },

    },

    methods: {

        async addExtension() {
            await this.extDev.showAddExtensionPopup();
            this.expandable.expand(this.expandId);
        },

        async removeExtension(ext) {
            await this.extDev.removeExtension(ext);
        },

        async publishExtension(ext) {
            await this.extDev.publishExtension(ext);
        },

        isExtensionPublished(ext) {
            return this.extReg.isVersionExist(ext.spec.name, ext.spec.version);
        },

        toggleExpanded() {
            this.expandable.toggleExpand(this.expandId);
        },

    }

};
</script>

<style scoped>
.local-extensions {
    padding: var(--gap--small) var(--gap);
    background: var(--color-cool--200);
}

.title {
    display: flex;
    align-items: center;
}

.ext-item {
    display: flex;
    align-items: center;
    padding: var(--gap--small) var(--gap);
    margin: 0 calc(-1 * var(--gap));
}

.ext-item:hover {
    background: rgba(0,0,0,.05);
}

.ext-item section {
    flex: 1;
}

.ext-dir {
    font-size: var(--font-size--small);
    color: var(--color-cool--500);
}

.ext-published {
    font-weight: bold;
    margin-right: var(--gap--small);
    color: var(--color-cool--500);
}

.ext-controls {
    white-space: nowrap;
}
</style>
