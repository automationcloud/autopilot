<template>
    <div class="param--pipeline">

        <div class="param__title"
            v-if="isShowLabel">
            {{ label }}
        </div>

        <template v-if="pipelineController">
            <pipeline-nested
                :pipeline-controller="pipelineController"
                :pipeline="value"/>
        </template>

        <template v-else>
            <pipeline
                :pipeline="value"
                :input-set="inputSet"/>
        </template>

    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin],

    components: {},

    beforeCreate() {
        // https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
        this.$options.components.PipelineNested = require('../pipes/pipeline-nested.vue').default;
        this.$options.components.Pipeline = require('../pipes/pipeline.vue').default;
    },

    computed: {

        isShowLabel() {
            const hasMultiplePipelines = this.item.getParams().filter(_ => _.type === 'pipeline').length > 1;
            return this.pipelineController || hasMultiplePipelines;
        },

    },

};
</script>

<style>
</style>
