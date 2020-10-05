<template>
    <div class="param--json">
        <codemirror class="param__code" v-model="value"/>
    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin]

};
</script>
