<template>
    <div class="ext-item ext-item--installed"
        :class="{
            'ext-item--connector': ext.spec.category === 'connector',
            'ext-item--private': ext.spec.private,
        }">
        <div class="ext-icon">
            {{ title[0] }}
        </div>

        <section style="flex: 1">
            <div class="ext-headline" @click="toggleExpand()">
                <span class="ext-private"
                    title="This extension cannot be used by other organisations"
                    v-if="ext.spec.private">
                    private
                </span>
                <span class="ext-title">
                {{ title }}
                </span>
                <i class="icon-help fas fa-question-circle"
                    v-if="description"></i>
                <!--
                <i class="icon-private fas fa-lock"
                    v-if="ext.spec.private"
                    title="This extension cannot be used by other organisations"></i>
                -->
            </div>
            <div class="ext-description" v-if="isExpanded && description">
                {{ description }}
            </div>
            <div class="ext-name">
                {{ ext.spec.name }}
                <span>
                v{{ ext.spec.version }}
                </span>
            </div>
            <div class="ext-dir">
                {{ ext.dir }}
                <i class="fas fa-eye color--primary clickable"
                    v-if="extDev.isWatching(ext)"
                    @click="extDev.unwatch(ext, true)"
                    title="Watching FS changes — click to stop watching">
                </i>
                <i class="fas fa-eye color--muted clickable"
                    v-if="!extDev.isWatching(ext)"
                    @click="extDev.watch(ext, true)"
                    title="Not watching FS changes — click to start watching">
                </i>
            </div>
            <div class="ext-tags">
                <span v-for="tag of ext.spec.tags"
                    :key="tag"
                    class="ext-tag">
                    {{ tag }}
                </span>
            </div>
        </section>

        <aside>
            <span v-if="isExtensionPublished()"
                    class="ext-published">
                    published
            </span>
            <button v-else
                class="button button--primary"
                title="Publish extension"
                @click="publishExtension()">
                <template v-if="processing === ext">
                    Publishing...
                </template>
                <template v-else>
                    Publish {{ ext.spec.version }}
                </template>
            </button>
            <button class="button button--secondary button--icon"
                @click="uninstall()"
                title="Uninstall extension">
                <i class="fas fa-trash-alt"></i>
            </button>
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
        'extDev',
    ],

    props: {
        ext: { type: Object, required: true }, // Extenesion
    },

    computed: {

        title() {
            return this.ext.spec.title ||
                util.humanize(this.ext.spec.name.replace(/.*\//, '').replace(/\bextension-/, '').replace(/\bconnector-/, ''));
        },

        isExpanded() {
            return this.expandable.isExpanded(this.ext.spec.id);
        },

        description() {
            return this.ext.spec.description.trim();
        },

        processing() {
            return this.extDev.processing;
        },

    },

    methods: {

        async uninstall() {
            await this.extDev.removeExtension(this.ext);
        },

        async publishExtension() {
            await this.extDev.publishExtension(this.ext);
        },

        isExtensionPublished() {
            return this.extReg.isVersionExist(this.ext.spec.name, this.ext.spec.version);
        },

        toggleExpand() {
            this.expandable.toggleExpand(this.ext.spec.id);
        },

    }

};
</script>

<style scoped>
.ext-dir {
    font-size: var(--font-size--small);
    color: var(--color-cool--500);
}
</style>
