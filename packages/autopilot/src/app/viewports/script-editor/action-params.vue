<template>
    <div class="action-params">

        <div v-for="partition of paramPartitions"
            :class="'partition--' + partition[0]">
            <edit-param
                v-for="param of partition[1]"
                :key="param.name"
                :param="param"
                :item="action"
                :item-proxy="actionProxy"
                :input-set="inputSet"/>
        </div>

    </div>
</template>

<script>
import EditParam from './params/edit-param.vue';

export default {

    components: {
        EditParam,
    },

    props: {
        action: { type: Object, required: true },
        actionProxy: { type: Object, required: true },
        inputSet: { type: Array },
    },

    computed: {

        params() {
            return this.action.getParams();
        },

        paramPartitions() {
            let index = this.params.length;
            for (const [i, param] of this.params.entries()) {
                if (param.type === 'pipeline' || param.type === 'preview') {
                    index = i + 1;
                }
            }
            return [
                ['main', this.params.slice(0, index)],
                ['options', this.params.slice(index) ]
            ].filter(_ => _[1].length > 0);
        },

    },

};
</script>

<style scoped>
.action-params {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-flow: column nowrap;
}

.partition--main {
    flex: 1;
}

.partition--options {
    background: var(--color-cool--200);
    border-top: 1px solid var(--color-cool--300);

    display: flex;
    flex-flow: row wrap;
}
</style>
