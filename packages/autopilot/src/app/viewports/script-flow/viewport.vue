<template>
    <div class="script-flow">

        <script-search v-if="searchShown"/>

        <div class="script-flow__contexts">
            <context-item
                v-for="context of script.contexts.items"
                :key="context.id"
                :context="context"/>
        </div>

    </div>
</template>

<script>
import ContextItem from './context-item.vue';
import ScriptSearch from './script-search.vue';

export default {

    components: {
        ContextItem,
        ScriptSearch,
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptFlow;
        },

        script() {
            return this.app.project.script;
        },

        searchShown() {
            return this.viewport.search.shown;
        },

    }

};
</script>

<style>
.script-flow {
    display: flex;
    flex-flow: column nowrap;
    overflow: initial;
}

.script-flow__contexts {
    flex: 1;
    overflow-y: auto;
}
</style>
