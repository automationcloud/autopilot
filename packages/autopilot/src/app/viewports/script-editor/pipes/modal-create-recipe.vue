<template>
    <modal class="modal-create-recipe section"
        :shown="shown"
        @close="hide()">

        <div class="section__title">
            New recipe
        </div>

        <div class="form-row">
            <div class="form-row__label">
                Name
            </div>
            <div class="form-row__controls">
                <input class="input input--block"
                    type="text"
                    v-focus
                    v-model.trim="recipeName"
                    @keyup.enter="createRecipe()"/>
            </div>
        </div>

        <div class="form-row">
            <div class="form-row__label">
                Group
            </div>
            <div class="form-row__controls">
                <autocomplete
                    class="stretch"
                    v-model.trim="recipeGroup"
                    placeholder="Default"
                    :options="getGroupNames()"
                    @keyup.enter="createRecipe()"/>
            </div>
        </div>

        <div class="form-row">
            <div class="form-row__label">
                Pipes ({{ selectedPipes.length }})
            </div>
            <div class="form-row__controls">
                <div class="modal-create-recipe__pipe"
                    v-for="pipe in selectedPipes">
                    {{ pipe.type }}
                </div>
            </div>
        </div>

        <div class="group group--gap" slot="buttons">
            <button class="button button--outlined-primary"
                @click="hide()">
                Cancel
            </button>
            <button class="button button--primary"
                @click="createRecipe()"
                :disabled="!canCreateRecipe">
                Create recipe
            </button>
        </div>

    </modal>
</template>

<script>
export default {

    inject: [
        'pipeRecipes'
    ],

    props: {

    },

    data() {
        return {
            recipeName: '',
            recipeGroup: this.getGroupNames()[0] || ''
        };
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        selectedPipes() {
            return this.viewport.getSelectedItems();
        },

        canCreateRecipe() {
            return this.recipeName && this.selectedPipes.length > 0;
        },

        shown() {
            return this.viewport.showCreateRecipeModal;
        }

    },

    methods: {

        getGroupNames() {
            return this.pipeRecipes.pipeGroups.map(_ => _.name);
        },

        createRecipe() {
            if (!this.canCreateRecipe) {
                return;
            }
            const pipes = this.selectedPipes;
            const { recipeName, recipeGroup } = this;
            try {
                this.app.viewports.recipes.createPipeRecipe(recipeGroup, recipeName, pipes);
                this.recipeName = '';
                this.hide();
            } catch (err) {
                alert(err.message);
            }
        },

        hide() {
            this.viewport.showCreateRecipeModal = false;
        }

    }

};
</script>

<style>
.modal-create-recipe__pipe {
    background: var(--color-warm--100);
    padding: var(--gap--small);
    border-radius: var(--border-radius);

    font-size: var(--font-size--small);
}

.modal-create-recipe__pipe + .modal-create-recipe__pipe {
    margin-top: var(--gap--small);
}
</style>
