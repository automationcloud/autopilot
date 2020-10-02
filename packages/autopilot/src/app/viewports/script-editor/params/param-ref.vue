<template>
    <div class="param--ref param--inset">

        <label class="param__field">
            <div class="param__label">
                {{ label }}
            </div>
            <div class="param__controls ref-controls">
                <select
                    class="input input--small stretch select-action-id"
                    v-model="actionId">
                    <option :value="''" label="- select action -"></option>
                    <optgroup v-for="group of actionGroups"
                        :label="group.label">
                        <option
                            v-for="action of group.actions"
                            :key="action.id"
                            :value="action.id">
                            {{ action.label }}
                        </option>
                    </optgroup>
                </select>
                <select
                    class="input input--small stretch"
                    v-model="paramName"
                    :disabled="!actionId">
                    <option :value="''" label="- select parameter -"></option>
                    <option
                        v-for="param of actionParams"
                        :key="param.name"
                        :value="param.name">
                        {{ param.label || param.name }}
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

        actionGroups() {
            const action = this.item.$action;
            const script = action.$script;
            const context = action.$context;
            const otherContexts = script.contexts.filter(_ => _.id !== context.id);
            return [
                {
                    label: context.name,
                    actions: this.getFilteredActions(context),
                },
                ...otherContexts.map(context => {
                    return {
                        label: context.name,
                        actions: this.getFilteredActions(context),
                    };
                })
            ].filter(_ => _.actions.length > 0);
        },

        actionParams() {
            const { actionId } = this;
            const action = this.item.$script.getActionById(actionId);
            if (!action) {
                return [];
            }
            return action.getParams().filter(_ => _.type === 'outcome');
        },

        actionId: {
            get() {
                return this.value.actionId || '';
            },
            set(actionId) {
                this.value = { ...this.value, actionId };
            }
        },

        paramName: {
            get() {
                return this.value.paramName || '';
            },
            set(paramName) {
                this.value = { ...this.value, paramName };
            }
        },

        isParamsShown() {
            const action = this.item.$script.getActionById(this.actionId);
            return action && action.getParams().filter(_ => _.type === 'outcome').length > 1;
        },

    },

    methods: {

        getFilteredActions(context) {
            return context.children.filter(action => {
                return action.id !== this.item.$action.id &&
                    action.getParams().some(_ => _.type === 'outcome');
            });
        }

    }

};
</script>

<style scoped>
.ref-controls {
    display: flex;
    flex-flow: row nowrap;
}

.select-action-id {
    margin-right: var(--gap--small);
}
</style>
