<template>
    <component :is="'edit-' + editorType"
        :key="key"
        class="script-editor"/>
</template>

<script>
import EditAction from './edit-action.vue';
import EditContext from './edit-context.vue';
import EditDefault from './edit-default.vue';
import EditNothing from './edit-nothing.vue';

export default {

    components: {
        EditDefault,
        EditNothing,
        EditContext,
        EditAction,
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        editorType() {
            return this.viewport.getEditorType();
        },

        key() {
            const sel = this.app.viewports.scriptFlow.getLastSelectedItem() || {};
            return sel.id || '';
        },

    },

    methods: {

    }

};
</script>

<style>
.script-editor {
}
</style>
