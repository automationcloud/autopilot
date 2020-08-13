<template>
    <div class="param--number param--inset">

        <div class="param__field">
            <div class="param__label">
                {{ label }}
            </div>
            <div class="param__controls">
                <input
                    type="number"
                    class="input input--inline"
                    v-model.number="value"
                    :placeholder="param.placeholder"
                    :min="min"
                    :max="max"/>
            </div>
        </div>

    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin],

    computed: {

        min() {
            return typeof this.param.min === 'number' ?
                this.param.min : -999999999;
        },

        max() {
            return typeof this.param.max === 'number' ?
                this.param.max : 999999999;
        }
    }

};
</script>
