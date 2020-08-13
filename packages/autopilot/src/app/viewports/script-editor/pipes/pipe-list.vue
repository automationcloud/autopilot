<template>
    <div class="pipe-list">

        <insert-line
            class="pipe-list__insert-head insert-line--hover"
            :class="{
                'insert-line--selected': isListSelected,
            }"
            :data-selection-id="pipeline.$path"
            :data-selected="isListSelected"
            tabindex="0"
            @click.stop="activateHead"
            @uiselect="selectHead"
            @uiactivate="activateHead"
            @contextmenu.prevent.stop="activateHead"/>

        <template v-for="(pipe, index) of pipeline.items">
            <pipe-item
                :key="pipe.id"
                :pipeline-controller="pipelineController"
                :pipe="pipe"
                :index="index"/>

            <insert-line
                :key="'insert-' + pipe.id"
                v-if="showInsertLines"
                class="pipe-list__insert-item insert-line--hover"
                @click.stop="showCreateMenu(pipe)"
                @contextmenu.prevent.stop="showCreateMenu(pipe)"/>
        </template>

    </div>
</template>

<script>
import PipeItem from './pipe-item.vue';

export default {

    components: {
        PipeItem,
    },

    props: {
        pipelineController: { type: Object, required: true },
        pipeline: { type: Object, required: true },
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptEditor;
        },

        isListSelected() {
            return this.viewport.isListHeadSelected(this.pipeline);
        },

        showInsertLines() {
            return this.viewport.isShowInsertLines();
        },

    },

    methods: {

        activateHead() {
            this.viewport.selectListHead(this.pipeline);
            // Workaround to viewport stealing focus asynchronously
            setTimeout(() => {
                this.viewport.menus.showCreatePipeMenu();
            }, 1);
        },

        selectHead() {
            this.viewport.selectListHead(this.pipeline);
        },

        showCreateMenu(pipe) {
            this.viewport.selectItem(pipe);
            // Workaround to viewport stealing focus asynchronously
            setTimeout(() => {
                this.viewport.menus.showCreatePipeMenu();
            }, 1);
        },

    }

};
</script>

<style>
.pipe-list {

}

.pipe-list__insert-head {
    height: 12px;
}

.pipe-list__insert-item {
    height: 12px;
}
</style>
