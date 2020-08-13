<template>
    <div class="edit-action">

        <div class="edit-action__label"
            v-if="action.isLabelEditable()">
            <input type="text"
                class="input frameless input--inverse"
                v-model="actionProxy.label"
                placeholder="Action label"/>
        </div>

        <div class="edit-action__container"
            v-if="feedback">
            <action-notes
                class="edit-action__notes"
                :action="action"/>

            <action-params
                :action="action"
                :action-proxy="actionProxy"
                :input-set="feedback.inputSet"/>

            <!--
            <component
                class="edit-action__component"
                :is="'action-' + action.type"
                :action="action"
                :action-proxy="actionProxy"
                :input-set="feedback.inputSet"/>
            -->
        </div>
    </div>
</template>

<script>
import ActionNotes from './action-notes.vue';
import ActionParams from './action-params.vue';
import { Feedback } from '../../util/feedback';

export default {

    components: {
        ActionNotes,
        ActionParams,
    },

    data() {
        return {
            feedback: null
        };
    },

    mounted() {
        this.feedback = new Feedback(this.app);
        this.feedback.set(this.action.$owner);
    },

    destroyed() {
        this.feedback.destroy();
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

    }

};
</script>

<style>
.edit-action {
    display: flex;
    flex-flow: column nowrap;
    flex: 1;

    overflow: hidden;
}

.edit-action__notes {
    margin: 0 var(--gap--small);
}

.edit-action__container {
    flex: 1;
    display: flex;
    flex-flow: column nowrap;
    overflow-y: auto;
}

.edit-action__component {
    flex: 1;
    display: flex;
    flex-flow: column nowrap;
    padding: var(--gap--small);
}

.edit-action__label {
    display: none;
    padding: var(--gap--small);
    background: var(--color-cool--500);
}

.layout-item--width--s .edit-action__label {
    display: block;
}
</style>
