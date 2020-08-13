<template>
    <div class="param--enum param--inset">
        <label class="param__field">
            <div class="param__label">
                {{ label }}
            </div>
            <div class="param__controls">
                <select
                    class="input"
                    v-model="value">
                    <option v-for="opt of options"
                        :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>
            </div>
        </label>
    </div>
</template>

<script>
import ParamMixin from './param-mixin';

export default {

    mixins: [ParamMixin],

    computed: {

        options() {
            const opts = this.param.enum;
            return opts.map(o => {
                const label = o.label ? o.label : o;
                const value = o.value ? o.value : o;
                return { label, value };
            });
        }

    }
};
</script>
