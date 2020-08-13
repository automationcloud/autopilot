<template>
    <div class="loaded-info">
        <div class="loaded-info__meta meta">
            <div class="meta__label">
                Currently loaded
            </div>
            <div class="meta__info">
                <template v-if="loadedScript">
                    {{ loadedScript.serviceName }}
                    {{ loadedScript.fullVersion }}
                    <template v-if="loadedScript.published">
                        (Active)
                    </template>
                </template>
                <template v-else>
                -
                </template>
            </div>
        </div>
        <div class="loaded-info__meta meta">
            <div class="meta__label">
                Active Version
            </div>
            <div class="meta__info">
                <template v-if="activeScript">
                {{ activeScript.fullVersion }}
                </template>
                <template v-else>
                -
                </template>
            </div>
        </div>
        <div class="loaded-info__meta meta">
            <div class="meta__label">
                Unpublished Changes
            </div>
            <div class="meta__info">
                {{ changesCount }}
            </div>
        </div>
    </div>
</template>

<script>
export default {

    computed: {

        viewport() {
            return this.app.viewports.api;
        },

        metadata() {
            return this.app.project.metadata;
        },

        changesCount() {
            return this.viewport.getChangesCount();
        },

        loadedScript() {
            return this.viewport.loadedScript;
        },

        activeScript() {
            return this.viewport.loadedServiceActiveScript;
        }

    },

    mounted() {
        this.refresh();
    },

    watch: {
        metadata: {
            deep: true,
            handler: 'refresh',
        },
    },

    methods: {

        refresh() {
            this.viewport.refresh();
        }

    },

};
</script>

<style>
.loaded-info {
    display: flex;
    margin: var(--gap);
}

.loaded-info__meta {
    margin-right: var(--gap--small);
}
</style>
