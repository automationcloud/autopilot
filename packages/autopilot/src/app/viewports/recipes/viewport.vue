<template>
    <div class="recipes">

        <pipe-group v-for="group of pipeGroups"
                :key="group.name"
                :group="group"/>

        <div class="recipes__add">
            <button class="button button--primary"
                @click="createGroup()">
                <i class="button__icon fas fa-plus"></i>
                <span>New group</span>
            </button>
        </div>

    </div>
</template>

<script>
import PipeGroup from './pipe-group.vue';

export default {

    inject: [
        'expandable',
    ],

    components: {
        PipeGroup,
    },

    computed: {
        viewport() { return this.app.viewports.recipes; },
        pipeGroups() { return this.viewport.pipeGroups; },
    },

    methods: {

        createGroup() {
            const group = this.viewport.insertPipeGroup({
                name: 'New group',
                recipes: [],
            });
            const groupId = this.viewport.getPipeGroupId(group);
            this.expandable.expand(groupId);
        },

    },

};
</script>

<style>
.recipes__add {
    padding: var(--gap);
}
</style>
