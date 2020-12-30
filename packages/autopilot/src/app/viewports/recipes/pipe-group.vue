<template>
    <div class="pipe-group">

        <div class="pipe-group__header group group--gap--small stretch"
            @contextmenu.stop.prevent="popupMenu"
            @dblclick="toggleRenaming()">
            <expand :id="groupId"
                :stop-propagation="true"/>
            <div class="pipe-group__name"
                v-if="!renaming">
                {{ group.name }}
                ({{ group.recipes.length}})
            </div>
            <input
                v-if="renaming"
                class="input frameless"
                type="text"
                v-focus
                v-select
                v-model="newName"
                @blur="renameGroup()"
                @keydown.enter="renameGroup()"/>
            <button class="button button--icon frameless"
                @click="popupMenu">
                <i class="fas fa-ellipsis-v"></i>
            </button>
        </div>

        <div class="pipe-group__body"
            v-if="isExpanded">
            <pipe-recipe
                v-for="recipe of group.recipes"
                :key="recipe.id"
                :group="group"
                :recipe="recipe"/>
        </div>

    </div>
</template>

<script>
import { menu } from '../../util';
import PipeRecipe from './pipe-recipe.vue';

export default {

    inject: [
        'expandable'
    ],

    components: {
        PipeRecipe
    },

    props: {
        group: { type: Object, required: true }
    },

    data() {
        return {
            renaming: false,
            newName: '',
        };
    },

    computed: {
        viewport() { return this.app.viewports.recipes; },
        groupId() { return this.viewport.getPipeGroupId(this.group); },
        isExpanded() {
            return this.expandable.isExpanded(this.groupId);
        }
    },

    methods: {

        popupMenu() {
            menu.popupMenu([
                {
                    label: 'Rename group',
                    click: () => this.toggleRenaming(),
                },
                ...this.viewport.getGroupMenu(this.group)
            ]);
        },

        toggleExpand() {
            this.expandable.toggleExpand(this.groupId);
        },

        toggleRenaming() {
            this.newName = this.group.name;
            this.renaming = !this.renaming;
        },

        renameGroup() {
            this.viewport.renamePipeGroup(this.group, this.newName);
            this.renaming = false;
            this.expandable.expand(this.groupId);
        },

        deleteGroup() {
            this.viewport.deletePipeGroup(this.group);
        },

    }

};
</script>

<style>
.pipe-group__header {
    display: flex;
    flex-flow: row nowrap;
    padding: var(--gap--small);
    border-bottom: 1px solid var(--color-mono--200);
}

.pipe-group__expand {
    padding: var(--gap--small);
}

.pipe-group__name {
    flex: 1;
    font-weight: 600;
    font-size: 13px;
}

.pipe-group__body {
    padding: 0;
    background: var(--color-mono--200);
    background: #fff;
}
</style>
