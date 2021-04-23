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
                v{{ manifest.latestVersion }}
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
                    @click="extReg.uninstallExtension(manifest.name)"
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
                util.humanize(this.manifest.name.replace(/^@.*\/$/, '').replace(/\bextension-/, '').replace(/\bconnector-/, ''));
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
        }

    }

};
</script>

<style scoped>

.ext-item {
    padding: var(--gap);
    display: flex;
    flex-flow: row nowrap;
    align-items: flex-start;
    background: var(--ui-color--white);
    border-bottom: solid 1px var(--color-cool--100);

    --background-color: var(--color-brand-red--500);
    --icon-border-radius: var(--border-radius);
}
.ext-item--connector {
    --background-color: var(--color-blue--500);
    --icon-border-radius: 20px;
}

.ext-item:first-child {
    border-top-left-radius: var(--border-radius);
    border-top-right-radius: var(--border-radius);
}

.ext-item:last-child {
    border-bottom-left-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);
}

.ext-item:hover {
    background: var(--color-mono--100);
}

.ext-headline {
    margin: var(--gap--small) 0;
}

.ext-title {
    font-weight: bold;
}

.ext-description {
    margin: var(--gap) 0;
    color: var(--color-cool--600);
}

.ext-name {
    display: inline-block;
    margin-right: var(--gap);
    line-height: 1.2;
    color: var(--color-mono--500);
}

.ext-tags {
    display: inline-flex;
    flex-flow: row nowrap;
}

.ext-tag {
    padding: 0 var(--gap--small);
    margin-right: var(--gap--small);
    color: #fff;
    background: var(--background-color);
    opacity: .4;
    border-radius: var(--border-radius);
    line-height: 1.4;
}

.ext-icon {
    flex: 0 0 40px;
    width: 40px;
    height: 40px;
    line-height: 40px;
    font-size: 20px;
    margin-right: var(--gap);
    border-radius: var(--icon-border-radius);
    text-align: center;
    background: var(--background-color);
    opacity: .4;
    color: #fff;
}

.ext-private {
    display: inline-block;
    font-weight: 400;
    text-transform: uppercase;
    font-size: var(--font-size--small);
    /* background: var(--color-yellow--500); */
    /* color: #fff; */
    color: var(--color-yellow--500);
    padding: 2px;
    border-radius: 4px;
    margin-right: 4px;
    border: 2px solid var(--color-yellow--500);
}

.ext-item--installed .ext-icon {
    opacity: 1;
}

.icon-help {
    margin-left: var(--gap--small);
    color: var(--color-cool--600);
}

.icon-private {
    margin-left: var(--gap--small);
    color: var(--color-yellow--400);
}

.icon-public {
    margin-left: var(--gap--small);
    color: var(--color-blue--400);
}
</style>
