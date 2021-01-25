<template>
    <div class="pipeline">
        <pipeline-input :input-set="inputSet"/>
        <pipe-list
            :pipeline-controller="this"
            :pipeline="pipeline"/>
        <pipeline-outcomes :pipeline-controller="this"/>
    </div>
</template>

<script>
import debouncePromise from 'debounce-promise';

import PipelineInput from './pipeline-input.vue';
import PipelineOutcomes from './pipeline-outcomes.vue';
import PipeList from './pipe-list.vue';

const DEFAULT_STATE = {
    spotlight: {
        pipeId: null,
        key: null
    },
    resultsMap: new Map(),
    stats: {},
    outcomes: null,
    error: null
};

export default {

    components: {
        PipelineInput,
        PipelineOutcomes,
        PipeList,
    },

    props: {
        pipeline: { type: Object, required: true },
        inputSet: { type: Array, required: true }
    },

    data() {
        return { ...DEFAULT_STATE };
    },

    created() {
        this.refreshThrottled = debouncePromise(this.refresh, 300);
    },

    watch: {
        'pipeline.id'() {
            this.invalidate();
        },
        'inputSet'() {
            this.refreshThrottled();
        },
        'pipelineJson'() {
            this.refreshThrottled();
        }
    },

    computed: {

        isSpotlightEnabled() {
            return this.spotlight.pipeId != null;
        },

        pipelineJson() {
            return JSON.stringify(this.pipeline);
        }

    },

    methods: {

        async refresh() {
            const { pipeline, inputSet } = this;
            this.error = null;
            this.introspectionResults = [];
            const ctx = pipeline.$action.createCtx();
            ctx.$introspectionEnabled = true;
            ctx.$introspectionSpotlight = this.spotlight;
            try {
                this.outcomes = await pipeline.selectAll(inputSet, ctx);
                this.$emit('outcomes', this.outcomes);
            } catch (err) {
                this.outcomes = null;
                this.error = err;
                this.$emit('error', err);
            } finally {
                this.compileIntrospectionResults(ctx);
            }
        },

        compileIntrospectionResults(ctx) {
            const map = new Map();
            for (const result of ctx.$introspectionResults) {
                if (result.pipeId) {
                    map.set(result.pipeId, result);
                } else if (result.pipelineId) {
                    map.set(result.pipelineId, result);
                }
            }
            this.resultsMap = map;
            this.stats = ctx.$introspectionStats;
        },

        getPipelineInputSet(pipelineId) {
            const res = this.resultsMap.get(pipelineId);
            return res ? res.inputSet : [];
        },

        getPipeResults(pipeId) {
            const result = this.resultsMap.get(pipeId);
            return result || {
                pipeId,
                inputSet: [],
                outputSet: null,
                nextInputSet: [],
                error: null,
                duration: 0
            };
        },

        isPipeSpotlighted(pipeId) {
            return this.spotlight.pipeId === pipeId;
        },

        isElSpotlighted(pipeId, index) {
            return this.spotlight.pipeId === pipeId && this.spotlight.index === index;
        },

        enableSpotlight(pipeId, index) {
            this.spotlight = {
                pipeId,
                index
            };
            this.refreshThrottled();
        },

        disableSpotlight() {
            this.spotlight = {
                pipeId: null,
                index: null
            };
            this.refreshThrottled();
        },

        invalidate() {
            Object.assign(this, DEFAULT_STATE);
        }

    }

};
</script>

<style>
.pipeline {
    flex: 1;
}

.pipeline--compact {
    flex: 0 0 auto;
}
</style>
