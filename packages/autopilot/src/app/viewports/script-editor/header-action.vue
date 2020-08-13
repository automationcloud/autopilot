<template>
    <div class="header-action">
        <div class="header-action__main">
            <i class="header-action__icon"
                :class="icon">
            </i>
            <div class="header-action__type"
                :title="action.type">
                {{ action.type }}
            </div>
            <input type="text"
                class="header-action__label input input--inverse"
                v-model="actionProxy.label"
                placeholder="Action label"
                v-if="action.isLabelEditable()"/>
        </div>
        <div class="header-action__aside">
            <button class="button button--icon frameless button--inverse"
                title="Edit action notes"
                @click="editingNotes = true"
                @uiactivate="editingNotes = true"
                tabindex="0">
                <i class="fas fa-edit">
                </i>
            </button>
        </div>

        <modal class="section"
            content-class="modal__content--wide"
            :shown="editingNotes"
            @close="editingNotes = false">

            <div class="section__title">
                Edit action notes
            </div>

            <div class="form-block">
                <textarea
                    rows="12"
                    v-model.trim="actionProxy.notes"
                    v-focus></textarea>
            </div>

            <div class="group group--gap" slot="buttons">
                <button class="button button--primary"
                    @click="editingNotes = false">
                    Done
                </button>
            </div>

        </modal>
    </div>
</template>

<script>
export default {

    data() {
        return {
            editingNotes: false,
        };
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        action() {
            return this.viewport.getSelectedAction();
        },

        actionProxy() {
            return this.viewport.createActionProxy(this.action);
        },

        icon() {
            return this.app.ui.objects.getActionIcon(this.action.type);
        }

    }

};
</script>

<style>
.header-action {
    flex: 1;
    display: flex;
}

.header-action__main, .header-action__aside {
    display: flex;
    align-items: center;
    color: var(--ui-color--white);
}

.header-action__main {
    flex: 1;
}

.header-action__aside {
    flex: 0 0 auto;
    padding-left: var(--gap--small);
}

.header-action__type {
    margin: 0 var(--gap--small);
    color: var(--color-blue--400);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}

.layout-item--width--s .header-action__label {
    display: none;
}

.header-action__label {
    flex: 1;
}

.header-action__label::placeholder {
    color: rgba(255,255,255,.5);
}

.header-action__button {
    padding: var(--gap--small);
    color: var(--ui-color--white);
}
</style>
