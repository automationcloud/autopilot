<template>
    <div class="viewport"
        :class="{
            'viewport--active': isActive
        }"
        tabindex="0"
        :data-viewport-id="viewportId"
        @click="activateViewport"
        @focusin="activateViewport"
        @keydown="onKeyDown">

        <div class="header">
            <div class="header-button"
                draggable
                @dragstart="onDragStart"
                @dragend="onDragEnd"
                @click="popupViewportsMenu">
                <i class="header-button-icon" :class="viewportIcon"></i>
                <i class="fas fa-chevron-down header-button-caret"></i>
            </div>
            <component
                v-if="componentId"
                class="header-component"
                :is="componentId + '-header'"/>
        </div>

        <component
            v-if="componentId"
            class="body"
            :is="componentId + '-viewport'"/>

        <div class="drag-overlay"
            v-if="showDragOverlay">
            <div class="drag-region drag-region--top"
                @dragenter="onDragEnter"
                @dragleave="onDragLeave"
                @dragover="onDragOver"
                @drop="onDrop($event, 'top')">
            </div>
            <div class="drag-region drag-region--bottom"
                @dragenter="onDragEnter"
                @dragleave="onDragLeave"
                @dragover="onDragOver"
                @drop="onDrop($event, 'bottom')">
            </div>
            <div class="drag-region drag-region--left"
                @dragenter="onDragEnter"
                @dragleave="onDragLeave"
                @dragover="onDragOver"
                @drop="onDrop($event, 'left')">
            </div>
            <div class="drag-region drag-region--right"
                @dragenter="onDragEnter"
                @dragleave="onDragLeave"
                @dragover="onDragOver"
                @drop="onDrop($event, 'right')">
            </div>
        </div>

        <div class="script-flow-bubble">s</div>
    </div>
</template>

<script>
import { helpers, menu } from '../util';

export default {

    inject: [
        'layout'
    ],

    props: {
        layoutItem: { type: Object }
    },

    beforeCreate() {
        // Load all viewports dynamically #webpackninjastyle
        const req = require.context('../viewports', true, /^.*(header|viewport)\.vue$/);
        for (const k of req.keys()) {
            // k looks like ./script-flow/viewport.vue
            const component = req(k).default;
            const name = k.split('./')[1].split('.vue')[0].replace('/', '-');
            this.$options.components[name] = component;
        }
    },

    mounted() {
        if (this.viewport && this.viewport.revealSelected) {
            this.viewport.revealSelected();
        }
    },

    computed: {

        viewport() {
            return this.app.viewports[this.layoutItem.viewportId];
        },

        componentId() {
            return helpers.camelToKebab(this.viewportId);
        },

        viewportId() {
            return this.viewport ? this.viewport.getViewportId() : '';
        },

        viewportName() {
            return this.viewport ? this.viewport.getViewportName() : '<new>';
        },

        viewportIcon() {
            return this.viewport ? this.viewport.getViewportIcon() : 'fas fa-circle';
        },

        isActive() {
            return this.viewport ? this.viewport.isViewportActive() : false;
        },

        isDragging() {
            return !!this.layout.draggingItem;
        },

        showDragOverlay() {
            const item = this.layout.draggingItem;
            if (!item) {
                return false;
            }
            // Only allow dragging outside
            return !this.layoutItem.contains(item);
        }

    },

    methods: {

        activateViewport() {
            if (this.viewport) {
                this.viewport.activateViewport();
            }
        },

        onDragStart(ev) {
            ev.dataTransfer.effectAllowed = 'move';
            this.layout.draggingItem = this.layoutItem;
        },

        onDragEnd() {
            this.layout.draggingItem = null;
        },

        onDragEnter(ev) {
            ev.target.classList.add('drag-region--active');
        },

        onDragLeave(ev) {
            ev.target.classList.remove('drag-region--active');
        },

        onDragOver(ev) {
            // To allow drop
            ev.preventDefault();
        },

        onDrop(ev, dir) {
            ev.preventDefault();
            ev.stopPropagation();
            const item = this.layout.draggingItem;
            if (item) {
                this.layout.moveOnto(this.layoutItem, item, dir);
            }
        },

        onKeyDown(ev) {
            this.app.ui.navigation.handleViewportNavigationKeydown(this.$el, ev);
        },

        popupViewportsMenu() {
            const menuItems = [];
            for (const viewport of Object.values(this.app.viewports)) {
                menuItems.push({
                    label: viewport.getViewportName(),
                    type: 'checkbox',
                    checked: this.layoutItem.viewportId === viewport.getViewportId(),
                    // TODO forbid enabling viewport more than once
                    enabled: true,
                    click: () => {
                        this.layoutItem.viewportId = viewport.getViewportId();
                        this.layout.activateViewport(this.layoutItem.viewportId);
                        this.layout.update();
                    }
                });
            }
            menuItems.push(
                { type: 'separator' },
                {
                    label: 'New horizontal panel',
                    click: () => {
                        const item = this.layout.createDetachedItem({
                            type: 'viewport',
                            viewportId: null
                        });
                        this.layout.split(this.layoutItem, item, 'bottom');
                    }
                },
                {
                    label: 'New vertical panel',
                    click: () => {
                        const item = this.layout.createDetachedItem({
                            type: 'viewport',
                            viewportId: null
                        });
                        this.layout.split(this.layoutItem, item, 'right');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Remove panel',
                    click: () => {
                        this.layout.remove(this.layoutItem);
                        this.layout.activateCycle();
                    },
                    enabled: this.layout.getViewportItems().length > 1
                }
            );
            menu.popupMenu(menuItems);
        }

    }

};
</script>

<style scoped>
.viewport {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-flow: column nowrap;
    box-shadow: 0 0 0 .5px rgba(0,0,0,.2);
    min-width: 0;
    min-height: 0;
}

.viewport:focus {
    outline: 0;
}

.viewport--active {
    z-index: 2;
}

.viewport--active .header {
    background: var(--color-mono--700);
}

.viewport--active .body {
    background: #fff;
}

.header {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-between;

    background: var(--color-mono--600);
    /* font-family: var(--font-family--alt); */
    /* font-weight: 400; */
}

.header-component {
    flex: 1;
    align-self: stretch;
    min-width: 0;

    display: flex;
    flex-flow: row nowrap;
    padding-right: var(--gap--small);
}

.header-button {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    padding: var(--gap--small);
    margin: var(--gap--small);
    font-size: 12px;
    color: var(--ui-color--white);
    /* background: var(--color-mono--800); */
    background: rgba(0,0,0,.4);
    border-radius: 2px;
}

.header-button-caret {
    margin-left: 4px;
    font-size: 8px;
    opacity: .5;
}

.body {
    flex: 1;
    overflow-y: auto;
    background: var(--color-mono--100);
}

.drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: rgba(255,255,255,.5);
}

.drag-region {
    position: absolute;
    z-index: 100;
}

.drag-region--active {
    background: var(--color-blue--500);
}

.drag-region--top {
    top: 0;
    left: 0;
    right: 0;
    height: 33%;
}

.drag-region--bottom {
    bottom: 0;
    left: 0;
    right: 0;
    height: 33%;
}

.drag-region--left {
    top: 0;
    bottom: 0;
    left: 0;
    width: 33%;
}

.drag-region--right {
    top: 0;
    bottom: 0;
    right: 0;
    width: 33%;
}
</style>
