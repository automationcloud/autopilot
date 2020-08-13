<template>
    <div class="action-list"
        :class="{
            'dnd-target': dnd.isValidDropTarget(list.$path)
        }">

        <insert-line
            class="action-list__insert-head insert-line--hover insert-line--padding"
            :class="{
                'insert-line--selected': isListSelected,
                'insert-line--shown111': !list.length,
            }"
            :data-selection-id="list.$path"
            :data-selected="isListSelected"
            :data-dnd-path="list.$path"
            tabindex="0"
            @click.stop="activateHead"
            @uiselect="selectHead"
            @uiactivate="activateHead"
            @contextmenu.prevent.stop="activateHead"
            v-on="dnd.createDropListeners()"/>

        <template v-for="(action, index) of list.items">
            <action-item
                :key="action.id"
                :action="action"/>
            <insert-line
                :key="'insert-' + action.id"
                v-if="showInsertLines"
                class="action-item__insert-item insert-line--hover"
                :class="{
                    'insert-line--padding': index === list.items.length - 1
                }"
                @click="showCreateMenu(action)"
                @contextmenu.prevent.stop="showCreateMenu(action)"/>
        </template>

    </div>
</template>

<script>
import ActionItem from './action-item.vue';

export default {

    components: {
        ActionItem
    },

    props: {
        list: { required: true }
    },

    computed: {

        viewport() {
            return this.app.viewports.scriptFlow;
        },

        isListSelected() {
            return this.viewport.isListHeadSelected(this.list);
        },

        showInsertLines() {
            return this.viewport.isShowInsertLines();
        },

        dnd() {
            return this.viewport.dndActions;
        },

    },

    methods: {

        activateHead() {
            this.viewport.selectListHead(this.list);
            // Workaround to viewport stealing focus asynchronously
            setTimeout(() => {
                this.viewport.menus.showCreateMenu();
            }, 1);
        },

        selectHead() {
            this.viewport.selectListHead(this.list);
        },

        showCreateMenu(action) {
            this.viewport.selectItem(action);
            // Workaround to viewport stealing focus asynchronously
            setTimeout(() => {
                this.viewport.menus.showCreateMenu();
            }, 1);
        }

    }

};
</script>

<style scoped>
.action-list__insert-item {
    height: 8px;
    margin: -2px var(--gap--small);
}

/* Actions DND */

.action-list.dnd-target >>> .action-list__insert-head {
    opacity: 1;
}

.action-list__insert-head.dnd--over {
    opacity: 1;
    --insert-line-color: var(--border-color--focus);
}
</style>
