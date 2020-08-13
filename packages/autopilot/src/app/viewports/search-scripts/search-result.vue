<template>
    <div class="search-result">
        <div class="section__title">
            {{ result.serviceName }} ({{ result.nodes.length }})
        </div>
        <div class="search-result__context"
            v-for="group of groupByContext(result.nodes)">
            <div class="section__subtitle">
                {{ group[0].name }} ({{ group[1].length }})
            </div>

            <div class="search-result__node flexrow"
                tabindex="0"
                :data-selection-id="result.serviceId + '-' + node.id"
                v-for="node of group[1]"
                title="Double-click to load it">
                <i :class="getNodeIcon(node)" style="flex: 0 0 20px"></i>
                <div class="search-result__node-name">
                    {{ node.name || node.label }}
                </div>
                <button class="button button--small button--icon button--flat button--primary"
                    @click="loadNode(node.id)">
                    <i class="fa fa-cloud-download-alt"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { helpers } from '../../util';

export default {

    props: {
        result: { type: Object },
    },

    computed: {

    },

    methods: {

        groupByContext() {
            return helpers.groupBy(this.result.nodes, node => node.$context);
        },

        getNodeIcon(node) {
            if (node.$entityType === 'context') {
                return 'fas fa-map-marker-alt';
            }
            return this.app.ui.objects.getActionIcon(node.type);
        },

        async loadNode(nodeId) {
            await this.app.tools.loadScriptService(this.result.scriptId, this.result.serviceId);
            const script = this.app.project.script;
            const node = script.getContextById(nodeId) || script.getActionById(nodeId);
            this.app.viewports.scriptFlow.activateViewport();
            if (node) {
                this.app.viewports.scriptFlow.selectItem(node);
                this.app.viewports.scriptFlow.revealSelected();
            }
        }

    }

};
</script>

<style>
.search-result__node-name {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
