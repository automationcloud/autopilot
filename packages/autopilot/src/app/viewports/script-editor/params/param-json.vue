<template>
    <div class="param--json">
        <div class="section__subtitle">
            {{ label }}
        </div>
        <codemirror class="param__code" v-model="value"/>
    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin]

};
</script>
