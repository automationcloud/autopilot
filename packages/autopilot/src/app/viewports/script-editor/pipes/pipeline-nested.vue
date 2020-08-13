<template>
    <div class="pipeline-nested">
        <pipeline-input
            :input-set="inputSet"
            v-if="isVerboseFeedback"/>
        <pipe-list
            class="pipeline-nested__pipes"
            :pipeline="pipeline"
            :pipeline-controller="pipelineController"/>
    </div>
</template>

<script>
import PipelineInput from './pipeline-input.vue';
import PipeList from './pipe-list.vue';

export default {

    props: {
        pipelineController: { type: Object, required: true },
        pipeline: { type: Object, required: true },
    },

    components: {
        PipelineInput,
        PipeList
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        inputSet() {
            return this.pipelineController.getPipelineInputSet(this.pipeline.id);
        },

        isVerboseFeedback() {
            return this.viewport.isShowVerboseFeedback();
        },
    }

};
</script>

<style>
.pipeline-nested {
}
</style>
