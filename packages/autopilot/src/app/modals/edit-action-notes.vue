<template>
    <div class="modal">
        <div class="modal__header">
            Edit action notes
        </div>
        <div class="modal__body">
            <div class="form-block">
                <textarea
                    rows="12"
                    v-model.trim="actionProxy.notes"
                    v-focus>
                </textarea>
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

        action() {
            return this.viewport.getSelectedAction();
        },

        actionProxy() {
            return this.viewport.createActionProxy(this.action);
        },

    },

}
</script>
