<template>
    <component :is="'edit-' + editorType"
        :key="key"
        class="script-editor"/>
</template>

<script>
import EditDefault from './edit-default.vue';
import EditNothing from './edit-nothing.vue';
import EditContext from './edit-context.vue';
import EditAction from './edit-action.vue';

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
