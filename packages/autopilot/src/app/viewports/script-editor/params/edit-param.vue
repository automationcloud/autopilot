<template>
    <component
        class="param"
        :is="'param-' + param.type"
        :param="param"
        :item="item"
        :item-proxy="itemProxy"
        :pipeline-controller="pipelineController"
        :input-set="inputSet"/>
</template>

<script>
import ParamMixin from './param-mixin';

import ParamBoolean from './param-boolean.vue';
import ParamButton from './param-button.vue';
import ParamDefinition from './param-definition.vue';
import ParamEnum from './param-enum.vue';
import ParamJavascript from './param-javascript.vue';
import ParamJson from './param-json.vue';
import ParamKeys from './param-keys.vue';
import ParamNumber from './param-number.vue';
import ParamOutcome from './param-outcome.vue';
import ParamPipeline from './param-pipeline.vue';
import ParamRecordset from './param-recordset.vue';
import ParamRef from './param-ref.vue';
import ParamSelector from './param-selector.vue';
import ParamString from './param-string.vue';
import ParamTemplate from './param-template.vue';

export default {

    mixins: [ParamMixin],

    components: {
        ParamBoolean,
        ParamButton,
        ParamDefinition,
        ParamEnum,
        ParamJavascript,
        ParamJson,
        ParamKeys,
        ParamNumber,
        ParamOutcome,
        ParamPipeline,
        ParamRecordset,
        ParamRef,
        ParamSelector,
        ParamString,
        ParamTemplate,
    }

};
</script>

<style scoped>
</style>
