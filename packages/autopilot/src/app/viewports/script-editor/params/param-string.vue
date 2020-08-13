<template>
    <div class="param--string param--inset">

        <label class="param__field">
            <div class="param__label">
                {{ label }}
            </div>
            <div class="param__controls">
                <autocomplete
                    v-model="value"
                    :placeholder="param.placeholder"
                    :options="createSourceOptions(param.source)"/>
            </div>
        </label>

    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin]

};
</script>
