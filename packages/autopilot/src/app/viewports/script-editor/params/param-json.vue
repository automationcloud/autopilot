<template>
    <div class="param--json param--inline">
        <codemirror v-model="value"/>
    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin]

};
</script>
