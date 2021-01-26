<template>
    <div class="sb"
        @contextmenu.prevent.stop="onContextMenu">

        <div class="sb__header stretch group group--merged">
            <div class="input stretch">
                <input type="text"
                    :value="value"
                    @input="onSelectorInput"
                    @keypress="onSelectorKeypress"
                    :placeholder="placeholder"/>
                <span class="sb__header-count">
                    &times; {{ resultsCount }}
                </span>
            </div>
            <button
                v-if="allowConfigure"
                class="button button--secondary button--icon"
                :class="{
                    'button--accent': isDomShown,
                }"
                title="Toggle selector builder"
                @click="isDomShown = !isDomShown">
                <i class="fa fa-cog"></i>
            </button>
            <button class="button button--primary button--icon button--flat"
                    :class="{
                        'button--active': inspecting
                    }"
                    title="Record selector from webpage"
                    @click="startInspect()"
                    :disabled="!scopeEl">
                <i class="fa fa-mouse-pointer"></i>
            </button>
        </div>

        <div class="sb__content"
            v-if="allowConfigure">

            <div class="sb__controls group group--merged"
                v-if="isDomShown">
                <a class="sb__link"
                    :class="{
                        'sb__link--active': focusMode,
                    }"
                    @click="toggleFocusMode()"
                    title="Toggle focus mode">
                    <i class="fa fa-bullseye">
                    </i>
                </a>
                <a class="sb__link"
                    :class="{
                        'sb__link--active': filterJunk,
                    }"
                    @click="toggleFilterJunk()"
                    title="Filter junk content">
                    <i class="fa fa-filter">
                    </i>
                </a>
            </div>

            <div class="sb__dom-viewer"
                v-if="isDomShown">
                <div class="sb__error--noscope"
                    v-if="!scopeEl">
                    Scope element not found.
                </div>
                <template v-if="scopeEl">
                    <sb-node v-if="scopeNode"
                        :node="scopeNode"
                        :key="scopeNode.nodeId"
                        :offset="0"/>
                    <div v-else
                        class="sb__dom-waiting">
                        Waiting for DOM...
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import { csskit, menu } from '../util';

import throttle from 'promise-smart-throttle';
import SbNode from './sb-node.vue';

export default {

    components: {
        SbNode
    },

    inject: [
        'inspect',
    ],

    props: {
        value: { type: String, required: true },
        scopeEl: { type: Object },
        unique: { type: Boolean, default: false },
        allowConfigure: { type: Boolean, default: true },
        placeholder: { type: String, default: '' }
    },

    data() {
        return {
            sb: this,
            scopeNode: null,
            isDomShown: false,
            inspecting: false,
            inspectedNode: null,
            highlightIds: new Set(),
            relevantIds: new Set(),
            expandedIds: new Set(),
            expandedIdsTick: 0,
            filterJunk: true,
            focusMode: true
        };
    },

    created() {
        this.refreshThrottled = throttle(this.refresh, 500);
    },

    mounted() {
        this.refreshThrottled();
    },

    destroyed() {
        if (this.inspecting) {
            this.inspect.stopInspect();
        }
    },

    watch: {
        value() {
            this.refreshThrottled();
        },
        scopeEl() {
            this.refreshThrottled();
        }
    },

    computed: {

        chunks() {
            return csskit.parseSelector(this.value);
        },

        resultsCount() {
            return this.highlightIds.size;
        },

        dom() {
            if (!this.scopeEl) {
                return null;
            }
            return this.scopeEl.page.domManager;
        }

    },

    methods: {

        onSelectorInput(ev) {
            this.setSelector(ev.target.value);
        },

        onSelectorKeypress(ev) {
            if (ev.shiftKey && ev.key === ' ') {
                ev.preventDefault();
                this.startInspect();
            }
        },

        isHighlighted(nodeId) {
            return this.highlightIds.has(nodeId);
        },

        isRelevant(nodeId) {
            return this.relevantIds.has(nodeId);
        },

        isExpanded(nodeId) {
            return this.expandedIdsTick && this.expandedIds.has(nodeId);
        },

        toggleFilterJunk() {
            this.filterJunk = !this.filterJunk;
        },

        toggleFocusMode() {
            this.focusMode = !this.focusMode;
        },

        expandHighlighted() {
            for (const nodeId of this.highlightIds.values()) {
                this.expandPathToNode(nodeId);
            }
        },

        expandPathToNode(nodeId) {
            const node = this.dom.getNodeById(nodeId);
            if (node && node.parentId) {
                this.expandNode(node.parentId);
            }
        },

        expandNode(nodeId) {
            this.expandedIds.add(nodeId);
            this.expandedIdsTick += 1;
            const node = this.dom.getNodeById(nodeId);
            if (node && node.parentId) {
                this.expandNode(node.parentId);
            }
        },

        collapseNode(nodeId) {
            this.expandedIds.delete(nodeId);
            this.expandedIdsTick += 1;
        },

        collapseAll() {
            this.expandedIds = new Set();
        },

        async startInspect() {
            if (!this.scopeEl) {
                return;
            }
            try {
                this.inspecting = true;
                const result = await this.inspect.recordElement(this.scopeEl, { unique: this.unique });
                if (result) {
                    const node = await this.dom.resolveNodeFromEl(result.element);
                    this.isDomShown = true;
                    this.inspectedNode = node;
                    this.setSelector(result.selector, true);
                    this.$once('refresh', () => this.revealInspected());
                }
            } finally {
                this.inspecting = false;
            }
        },

        setSelector(newSelector, fromInspector = false) {
            if (this.value !== newSelector) {
                this.$emit('input', newSelector);
                this.$emit('change', { newSelector, fromInspector });
            }
        },

        async forceRefresh() {
            this.dom.invalidate();
            await this.refresh();
        },

        async refresh() {
            this.scopeNode = this.scopeEl ? await this.dom.resolveNodeFromEl(this.scopeEl) : null;
            if (!this.scopeNode) {
                return;
            }
            try {
                const nodeIds = await this.dom.querySelectorAll(this.scopeNode.nodeId, this.value);
                this.highlightIds = new Set(nodeIds);
            } catch (err) {
                this.highlightIds = new Set();
            } finally {
                this.updateRelevantIds();
                this.expandHighlighted();
                this.$emit('refresh');
            }
        },

        updateRelevantIds() {
            const _add = nodeId => {
                if (this.relevantIds.has(nodeId)) {
                    return;
                }
                this.relevantIds.add(nodeId);
                const node = this.dom.getNodeById(nodeId);
                if (node && node.parentId) {
                    _add(node.parentId);
                }
            };

            this.relevantIds = new Set();
            for (const nodeId of this.highlightIds.values()) {
                _add(nodeId);
            }
        },

        revealInspected() {
            const { inspectedNode } = this;
            if (inspectedNode) {
                this.expandPathToNode(inspectedNode.nodeId);
                this.revealNode(inspectedNode.nodeId);
            }
        },

        revealNode(nodeId) {
            // NOTE setTimeout is preferred to $nextTick here
            // because multiple updates can be scheduled asynchronously
            // from `refresh` and `startInspect`
            setTimeout(() => {
                const el = this.$el.querySelector(`[data-node-id="${nodeId}"]`);
                if (el) {
                    el.scrollIntoViewIfNeeded();
                }
            }, 100);
        },

        onContextMenu(ev) {
            menu.popupMenu([
                {
                    label: 'Force Refresh',
                    click: () => {
                        this.forceRefresh();
                    }
                },
            ]);
        },

    }

};
</script>

<style>
.sb {
}

.sb__error--noscope {
    padding: var(--gap--small);

    background: #fff0f5;
    color: var(--color-red--500);

    font-family: var(--font-family--mono);
    font-size: 10px;
    line-height: 15px;
}

.sb__header.group--merged > *:first-child {
    border-top-left-radius: 2px;
    border-bottom-left-radius: 2px;
}

.sb__header.group--merged > *:last-child {
    border-top-right-radius: 2px;
    border-bottom-right-radius: 2px;
}

.sb__header-count {
    padding: 0 var(--gap--small);
    color: var(--color-cool--500);
    align-self: center;
}

.sb__content {
    margin-top: var(--gap--small);
    position: relative;
    z-index: 1;
    background: var(--ui-color--white);
    border-radius: var(--border-radius);
}

.sb__controls {
    position: absolute;
    z-index: 3;
    right: 0;
    top: 0;
    margin-top: var(--gap--small);
}

.sb__dom-viewer {
    padding: var(--gap--small);
    border-radius: 0 0 var(--border-radius) var(--border-radius);
    min-height: 28px;
    overflow: auto;
}

.sb__dom-waiting {
    line-height: 16px;
    opacity: 0.5;
}

.sb__summary {
    flex: 1;
}

.sb__link {
    padding: 2px var(--gap--small);
    color: var(--color-warm--500);
}

.sb__link--active {
    color: var(--color-blue--500);
}

</style>
