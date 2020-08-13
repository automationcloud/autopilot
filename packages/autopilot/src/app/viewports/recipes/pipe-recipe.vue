<template>
    <div class="pipe-recipe">
        <div class="pipe-recipe__main"
            @dblclick="toggleRenaming()"
            @contextmenu.stop.prevent="popupMenu">
            <span v-if="!renaming">{{ recipe.name }}</span>
            <input
                v-if="renaming"
                class="input frameless"
                type="text"
                v-focus
                v-select
                v-model="newName"
                @blur="renameRecipe()"
                @keydown.enter="renameRecipe()"/>
        </div>
        <div class="pipe-recipe__controls group group--gap--small">
            <!--
            <button class="button button--icon frameless"
                @click="toggleRenaming()">
                <i class="fas fa-pencil-alt"></i>
            </button>
            -->
            <button class="button button--icon frameless"
                @click="deleteRecipe()">
                <i class="fas fa-times-circle"></i>
            </button>
        </div>
    </div>
</template>

<script>
import { menu } from '../../util';

export default {

    props: {
        recipe: { type: Object, required: true },
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
    },

    methods: {

        popupMenu() {
            menu.popupMenu([
                {
                    label: 'Rename recipe',
                    click: () => this.toggleRenaming(),
                },
                ...this.viewport.getRecipeMenu(this.group, this.recipe),
            ]);
        },

        toggleRenaming() {
            this.newName = this.recipe.name;
            this.renaming = !this.renaming;
        },

        renameRecipe() {
            this.viewport.renamePipeRecipe(this.group, this.recipe, this.newName);
            this.renaming = false;
        },

        deleteRecipe() {
            this.viewport.deletePipeRecipe(this.group, this.recipe);
        }

    }

};
</script>

<style>
.pipe-recipe {
    display: flex;
    align-items: center;
    padding: 0 var(--gap--small);
    min-height: 3em;
    border-bottom: 1px solid var(--color-mono--100);
}

.pipe-recipe:hover {

}

.pipe-recipe__main {
    flex: 1;
    min-width: 0;
    padding-left: var(--gap);
}

.pipe-recipe__name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pipe-recipe__input {
    display: block;
    box-sizing: border-box;
    width: 100%;
    border: 0;
    background: var(--color-mono--200);
    padding: var(--gap--small);
    outline: 0;
}

.pipe-recipe__controls {
    padding-left: var(--gap);
}
</style>
