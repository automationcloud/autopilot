<template>
    <div class="script-list">

        <script-item v-for="script of controller.scripts"
            :key="script.id"
            :script="script"/>

        <div class="flexrow"
            v-if="controller.hasMore">
            <a @click="controller.loadMore()">
                Load more scripts
            </a>
        </div>

    </div>
</template>

<script>
import ScriptItem from './script-item.vue';

export default {

    components: {
        ScriptItem,
    },

    computed: {
        viewport() { return this.app.viewports.api; },
        controller() { return this.viewport.scripts; },
    },

    mounted() {
        this.controller.refresh();
    },

    methods: {

    }

};
</script>

<style>
.script-list {

}
</style>
