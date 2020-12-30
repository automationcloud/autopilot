<template>
    <div class="log-outputs section">
        <explore
            :data="{ 'Unreached outputs': unreachedOutputKeys }"
            :options="{ types: false, indexBase: 1 }"/>
    </div>
</template>

<script>
export default {

    inject: [
        'protocol',
        'project',
        'expandable',
    ],

    computed: {

        expandKey() {
            return 'report/outputs';
        },

        isExpanded() {
            return this.expandable.isExpanded(this.expandKey);
        },

        allOutputKeys() {
            const domain = this.protocol.getDomain();
            return domain ? domain.getOutputs().map(_ => _.key) : [];
        },

        reachedOutputKeys() {
            const script = this.project.script;
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
            this.expandable.toggleExpand(this.expandKey);
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
