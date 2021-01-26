<template>
    <div class="modal">
        <div class="modal__header">
            Edit pipe notes
        </div>
        <div class="modal__body">
            <div class="form-row">
                <div class="form-row__label">
                Label
                </div>
                <div class="form-row__controls group group--gap">
                    <input class="input stretch"
                        v-model="pipeProxy.label"
                        v-focus/>
                </div>
            </div>
            <div class="form-block">
                <textarea
                    rows="12"
                    v-model.trim="pipeProxy.notes"></textarea>
            </div>
        </div>
        <div class="modal__buttons">
            <button class="button button--primary"
                @click="$emit('hide')">
                Done
            </button>
        </div>
    </div>
</template>

<script>
export default {

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        pipeProxy() {
            const pipe = this.viewport.getSelectedItems()[0];
            if (!pipe) {
                return null;
            }
            return this.viewport.createPipeProxy(pipe);
        },

    },

};
</script>
