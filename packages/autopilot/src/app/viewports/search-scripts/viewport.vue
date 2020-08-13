<template>
    <div class="search-scripts section">
        <edit-json v-model="queries"/>

        <div class="search-scripts__body">
            <loader v-if="viewport.loading"/>
            <div class="search-scripts__panel" v-if="!viewport.loading">
                <button class="button button--primary"
                    v-if="!viewport.searching"
                    :disabled="viewport.services.length == 0"
                    @click="viewport.startSearch()">
                    Search in {{ viewport.services.length }} services
                </button>
                <button class="button button--primary"
                    v-if="viewport.searching"
                    @click="viewport.stopSearch()">
                    Stop search
                </button>
            </div>

            <div class="search-scripts__status">
                <div class="search-scripts__status-main">
                    {{ viewport.statusText }}
                </div>
                <div class="search-scripts__status-aside">
                    <a v-if="viewport.results.length"
                        @click="viewport.exportCsv()">
                        Export to CSV
                    </a>
                </div>
            </div>

            <div class="search-script__results">
                <search-result v-for="result of viewport.results"
                    :result="result"
                    :key="result.serviceId"/>
            </div>
        </div>

    </div>
</template>

<script>
import SearchResult from './search-result.vue';

export default {

    components: {
        SearchResult,
    },

    mounted() {
        this.viewport.fetchServices();
    },

    computed: {
        viewport() { return this.app.viewports.searchScripts; },

        queries: {
            get() {
                return this.viewport.getQueries();
            },
            set(val) {
                this.viewport.applyState({ queries: val });
            }
        },

    }

};
</script>

<style>
.search-scripts__body {
    padding: var(--gap--small);
}

.search-scripts__status {
    padding: var(--gap--small) 0;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
}
</style>
