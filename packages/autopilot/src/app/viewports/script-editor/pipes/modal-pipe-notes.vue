<template>
    <modal class="modal-pipe-notes section"
        content-class="modal__content--wide"
        :shown="isShown"
        @close="hide()"
        v-if="pipeProxy">

        <div class="section__title">
            Edit pipe notes
        </div>

        <div class="form-row">
            <div class="form-row__label">
               Label
            </div>
            <div class="form-row__controls group group--gap">
                <input class="input stretch"
                    v-model="pipeProxy.label"/>
            </div>
        </div>

        <div class="form-block">
            <textarea
                rows="12"
                v-model.trim="pipeProxy.notes"
                v-focus></textarea>
        </div>

        <div class="group group--gap" slot="buttons">
            <button class="button button--primary"
                @click="hide()">
                Done
            </button>
        </div>

    </modal>
</template>

<script>
export default {

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        isShown() {
            return this.viewport.showEditNotes;
        },

        pipeProxy() {
            const pipe = this.viewport.getSelectedItems()[0];
            if (!pipe) {
                return null;
            }
            return this.viewport.createPipeProxy(pipe);
        },

    },

    methods: {

        hide() {
            this.viewport.showEditNotes = false;
        }

    }

};
</script>
