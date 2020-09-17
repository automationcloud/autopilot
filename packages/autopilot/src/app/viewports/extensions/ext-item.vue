<template>
    <div class="ext-item"
        :class="{
            'ext-item--installed': installed,
        }">
        <div class="ext-icon">
            <i class="fas fa-puzzle-piece"></i>
        </div>

        <section style="flex: 1">
            <div class="ext-title" @click="toggleExpand()">
                {{ title }}
                <i class="help-circle fas fa-question-circle"
                    v-if="description"></i>
            </div>
            <div class="ext-description" v-if="isExpanded && description">
                {{ description }}
            </div>
            <div class="ext-name">
                {{ manifest.name }}:{{ manifest.latestVersion }}
            </div>
        </section>

        <aside>
            <template v-if="installed">
                <button v-if="extReg.isOutdated(manifest)"
                    class="button button--yellow button--icon"
                    @click="extReg.updateExtension(manifest)"
                    title="Update the extension to latest version"
                    :disabled="extReg.loading">
                    <i v-if="isProcessing"
                        class="fas fa-spinner fa-spin"></i>
                    <i v-else class="fas fa-arrow-circle-up"></i>
                </button>
                <button class="button button--secondary button--icon"
                    @click="extReg.uninstallExtension(manifest)"
                    title="Uninstall extension"
                    :disabled="extReg.loading">
                    <i v-if="isProcessing"
                        class="fas fa-spinner fa-spin"></i>
                    <i v-else class="fas fa-times"></i>
                </button>
            </template>
            <template v-else>
                <button class="button button--primary button--icon"
                    @click="extReg.installExtension(manifest)"
                    title="Install extension"
                    :disabled="extReg.loading">
                    <i v-if="isProcessing"
                        class="fas fa-spinner fa-spin"></i>
                    <i v-else class="fas fa-plus"></i>
                </button>
            </template>
            <!-- TODO spinner when updating -->
        </aside>

    </div>
</template>

<script>
import { util } from '@automationcloud/engine';

export default {

    inject: [
        'expandable',
        'extReg',
    ],

    props: {
        manifest: { type: Object, required: true },
        installed: { type: Boolean, required: true },
    },

    computed: {

        title() {
            return this.manifest.title ||
                util.humanize(this.manifest.name.replace(/^.*\//, '').replace(/\bextension-/, ''));
        },

        isExpanded() {
            return this.expandable.isExpanded(this.manifest.id);
        },

        description() {
            return this.manifest.description.trim();
        },

        isProcessing() {
            return this.extReg.loading && this.extReg.processingManifest === this.manifest;
        },

    },

    methods: {

        toggleExpand() {
            this.expandable.toggleExpand(this.manifest.id);
        }

    }

};
</script>

<style scoped>

.ext-item {
    margin: 0 calc(-1 * var(--gap));
    padding: var(--gap);
    display: flex;
    flex-flow: row nowrap;
    align-items: flex-start;
}

.ext-item:hover {
    background: rgba(0,0,0,.01);
}

.ext-title {
    font-weight: bold;
    margin: var(--gap--small) 0;
}

.ext-description {
    margin: var(--gap) 0;
    color: var(--color-cool--600);
}

.ext-name {
    color: var(--color-cool--600);
}

.ext-icon {
    flex: 0 0 40px;
    width: 40px;
    height: 40px;
    line-height: 40px;
    font-size: 24px;
    margin-right: var(--gap);
    border-radius: var(--border-radius);
    text-align: center;
    background: var(--color-cool--200);
    color: #fff;
}

.ext-item--installed .ext-icon {
    background: var(--color-cool--500);
}

.help-circle {
    margin-left: var(--gap--small);
    color: var(--color-cool--600);
}
</style>
