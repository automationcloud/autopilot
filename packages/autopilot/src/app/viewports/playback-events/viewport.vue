<template>
    <div class="playback-events section">
        <select class="input"
            v-model="filterMode">
            <option value="all">All events</option>
            <option value="input">Inputs</option>
            <option value="output">Outputs</option>
            <option value="input+output">Inputs & Outputs</option>
        </select>
        <log-outputs/>
        <log-item v-for="(item, index) of filteredItems"
            :item="item"
            :is-first="index === 0"
            :is-last="index === items.length - 1"
            :timestamp-origin="timestampOrigin"
            :key="index"/>
    </div>
</template>

<script>
import LogItem from './log-item.vue';
import LogOutputs from './log-outputs.vue';

export default {

    inject: [
        'playback'
    ],

    components: {
        LogItem,
        LogOutputs,
    },

    data() {
        return {
            filterMode: 'all'
        };
    },

    computed: {

        items() {
            return this.playback.logs.slice().reverse();
        },

        filteredItems() {
            switch (this.filterMode) {
                case 'input':
                    return this.items.filter(_ => _.type === 'input');
                case 'output':
                    return this.items.filter(_ => _.type === 'output');
                case 'input+output':
                    return this.items.filter(_ => ['input', 'output'].includes(_.type));
                default:
                    return this.items;
            }
        },

        timestampOrigin() {
            const first = this.playback.logs[0] || { timestamp: Date.now() };
            return first.timestamp;
        }

    }

};
</script>

<style>
.playback-events {
    flex: 1;
    overflow-y: auto;
    background: var(--color-mono--100);
    padding: var(--gap);
}
</style>
