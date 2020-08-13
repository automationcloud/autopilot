<template>
    <div class="param--pipeline">

        <template v-if="pipelineController">
            <div class="param__title">
                {{ label }}
            </div>

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

    components: {
        // PipelineNested: () => import('./pipeline-nested.vue')
    },

    beforeCreate() {
        // https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components
        this.$options.components.PipelineNested = require('../pipes/pipeline-nested.vue').default;
        this.$options.components.Pipeline = require('../pipes/pipeline.vue').default;
    }

};
</script>

<style>
</style>
