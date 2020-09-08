<template>
    <div class="log-outputs section">
        <explore
            :data="{ 'Unreached outputs': unreachedOutputKeys }"
            :options="{ types: false, indexBase: 1 }"/>
    </div>
</template>

<script>
import { ExpandableController } from '~/controllers';

export default {

    computed: {

        expandKey() {
            return 'report/outputs';
        },

        isExpanded() {
            return this.get(ExpandableController).isExpanded(this.expandKey);
        },

        allOutputKeys() {
            const domain = this.app.tools.getDomain();
            return domain ? domain.getOutputs().map(_ => _.key) : [];
        },

        reachedOutputKeys() {
            const script = this.app.project.script;
            return script.$outputs.map(_ => _.key);
        },

        unreachedOutputKeys() {
            const all = this.allOutputKeys;
            const unreached = new Set(all);
            for (const key of this.reachedOutputKeys) {
                unreached.delete(key);
            }
            return [...unreached];
        }

    },

    methods: {

        toggleExpand() {
            this.app.ui.toggleExpand(this.expandKey);
        }

    }

};
</script>

<style>
.log-outputs {
    margin: var(--gap) 0;
}

.log-outputs__expand {
    display: inline-block;
    width: 16px;
    text-align: center;
}

.log-outputs__title {
    cursor: pointer;
}

.log-outputs__body {
    margin-left: var(--gap--small);
    border-left: 2px solid var(--color-cool--500);
}

.log-outputs__key {
    padding: var(--gap--small);
}
</style>
