<template>
    <div class="param--boolean">
        <label>
            <input
                type="checkbox"
                v-model="value"/>
            {{ label }}
        </label>
    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin]

};
</script>
