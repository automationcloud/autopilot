<template>
    <div class="ext-item"
        :class="{
            'ext-item--connector': manifest.category === 'connector',
            'ext-item--installed': installed,
            'ext-item--private': manifest.private,
        }">
        <div class="ext-icon">
            {{ title[0] }}
        </div>

        <section style="flex: 1">
            <div class="ext-headline" @click="toggleExpand()">
                <span class="ext-private"
                    title="This extension cannot be used by other organisations"
                    v-if="manifest.private">
                    private
                </span>
                <span class="ext-title">
                {{ title }}
                </span>
                <i class="icon-help fas fa-question-circle"
                    v-if="description"></i>
                <!--
                <i class="icon-private fas fa-lock"
                    v-if="manifest.private"
                    title="This extension cannot be used by other organisations"></i>
                -->
            </div>
            <div class="ext-description" v-if="isExpanded && description">
                {{ description }}
            </div>
            <div class="ext-name">
                {{ manifest.name }}
                <span v-if="installed">
                v{{ extReg.getInstalledVersion(manifest) }}
                </span>
                <span v-else>
                v{{ manifest.latestVersion || manifest.version }}
                </span>
            </div>

            <div class="ext-tags">
                <span v-for="tag of manifest.tags"
                    :key="tag"
                    class="ext-tag">
                    {{ tag }}
                </span>
            </div>
        </section>

        <aside>
            <template v-if="installed">
                <button v-if="extReg.isOutdated(manifest)"
                    class="button button--yellow button--icon"
                    @click="extReg.updateExtension(manifest.name, manifest.latestVersion)"
                    title="Update the extension to latest version"
                    :disabled="extReg.loading">
                    <i class="fas fa-arrow-circle-up"></i>
                </button>
                <button class="button button--secondary button--icon"
                    @click="uninstall()"
                    title="Uninstall extension"
                    :disabled="extReg.loading">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </template>
            <template v-else>
                <button class="button button--primary button--icon"
                    @click="extReg.installExtension(manifest.name, manifest.latestVersion)"
                    title="Install extension"
                    :disabled="extReg.loading">
                    <i class="fas fa-plus"></i>
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
                util.humanize(this.manifest.name.replace(/.*\//, '').replace(/\bextension-/, '').replace(/\bconnector-/, ''));
        },

        isExpanded() {
            return this.expandable.isExpanded(this.manifest.id);
        },

        description() {
            return this.manifest.description.trim();
        },

    },

    methods: {

        toggleExpand() {
            this.expandable.toggleExpand(this.manifest.id);
        },

        uninstall() {
            this.extReg.uninstallExtension(this.manifest.name);
        }

    }

};
</script>

<style scoped>
</style>
