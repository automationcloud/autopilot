<template>
    <div class="param--definition">

        <label class="param__field">
            <div class="param__label">
                {{ label }}
            </div>
            <div class="param__controls">
                <select
                    class="input"
                    v-model="value">
                    <option :value="null" label="- select definition -"></option>
                    <optgroup v-for="group of definitionGroups"
                        :label="group.label">
                        <option
                            v-for="def of group.definitions"
                            :key="def.id"
                            :value="def.id">
                            {{ def.label }}
                        </option>
                    </optgroup>
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

        definitionGroups() {
            const action = this.item.$action;
            const script = action.$script;
            const context = action.$context;
            const otherContexts = script.contexts.filter(_ => _.id !== context.id);
            return [
                {
                    label: context.name,
                    definitions: context.definitions.filter(_ => _.id !== action.id)
                },
                ...otherContexts.map(ctx => {
                    return {
                        label: ctx.name,
                        definitions: ctx.definitions.filter(_ => _.id !== action.id)
                    }
                })
            ].filter(_ => _.definitions.length > 0);
        }

    }

};
</script>
