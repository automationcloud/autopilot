<template>
    <div class="param--javascript param--inline">
        <codemirror v-model="value"/>
    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {
    mixins: [ParamMixin]
};
</script>
