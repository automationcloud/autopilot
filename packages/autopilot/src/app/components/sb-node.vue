<template>
    <div class="sb-node"
            v-if="!isHidden">

        <template v-if="isElementNode">
            <div class="sb-node__line"
                :class="{
                    'sb-node__line--highlighted': isHighlighted,
                    'sb-node__line--relevant': isRelevant,
                    'sb-node__line--inspected': isInspected,
                    'sb-node__line--active': isNodeActive,
                    'sb-node__line--expandable': hasChildren,
                }"
                @mouseenter="onEnter"
                @mouseleave="onLeave"
                @contextmenu.prevent.stop="onContextMenu"
                :data-node-id="node.nodeId"
                v-if="!isOmitted">

                <template v-if="hasChildren">
                    <i
                        class="sb-node__expand fas fa-caret-right"
                        @click="expand()"
                        v-if="!isExpanded">
                    </i>

                    <i
                        class="sb-node__expand fas fa-caret-down"
                        @click="collapse()"
                        v-if="isExpanded">
                    </i>
                </template>

                <span class="sb-node__tagname sb-node__comp"
                    :class="{
                        'sb-node__comp--active': isTagActive,
                    }"
                    @click="toggleTag($event)">
                    {{ tagName }}
                </span>

                <span v-if="id && !isJunkIdentifier(id)"
                    class="sb-node__id sb-node__comp"
                    :class="{
                        'sb-node__comp--active': isIdActive,
                    }"
                    @click="toggleId($event)">
                    #{{ id }}
                </span>

                <template v-for="cl of classList">
                    <span v-if="!isJunkIdentifier(cl)"
                        class="sb-node__class sb-node__comp"
                        :class="{
                            'sb-node__comp--active': isClassActive(cl),
                        }"
                        @click="toggleClass($event, cl)">
                        .{{ cl }}
                    </span>
                </template>

                <template v-for="(val, key) of filteredAttributes">
                    <span class="sb-node__attr sb-node__comp"
                        :class="{
                            'sb-node__comp--active': isAttrActive(key, val),
                        }"
                        @click="toggleAttr($event, key, val)">
                        <span class="sb-node__delim">[</span>
                        <span class="sb-node__attr-key">{{ key }}</span>
                        <template v-if="val">
                            <span class="sb-node__delim">=</span>
                            <span class="sb-node__attr-val"
                                :title="val">{{ val }}</span>
                        </template>
                        <span class="sb-node__delim">]</span>
                    </span>
                </template>

            </div>

            <div class="sb-node__children"
                    :class="{
                        'sb-node__children--indented': !isOmitted,
                    }">
                <template v-if="isExpanded">
                    <sb-node v-for="childNode of node.children"
                        :node="childNode"
                        :offset="childOffset"
                        :is-inside-highlighted="isInsideHighlighted || isHighlighted"
                        :key="childNode.nodeId"/>
                </template>
            </div>
        </template>

        <template v-if="isDocumentNode">
            <sb-node v-if="htmlNode"
                :key="htmlNode.nodeId"
                :node="htmlNode"
                :offset="offset"/>
        </template>

        <template v-if="isTextNode">
            <div class="sb-node__text">
                {{ node.nodeValue }}
            </div>
        </template>
    </div>
</template>

<script>
const IGNORED_TAGS = ['STYLE', 'SCRIPT', 'NOSCRIPT', 'META', 'LINK'];

import { csskit, menu } from '../util';

export default {

    name: 'sb-node',

    props: {
        node: { type: Object, required: true },
        offset: { type: Number, required: true },
        isInsideHighlighted: { type: Boolean, default: false }
    },

    data() {
        return {
            sb: this.$parent.sb
        };
    },

    computed: {

        isElementNode() {
            return this.node.nodeType === 1 &&
                !IGNORED_TAGS.includes(this.node.nodeName);
        },

        isTextNode() {
            // Whitespace-only text nodes are excluded
            return this.node.nodeType === 3 && this.node.nodeValue.trim();
        },

        isDocumentNode() {
            return this.node.nodeType === 9;
        },

        htmlNode() {
            // Document nodes not shown explictly (to avoid #document in tree),
            // instead its HTML child is shown
            return (this.node.children || []).find(n => n.nodeName === 'HTML');
        },

        attributes() {
            return this.sb.dom.convertAttributes(this.node.attributes);
        },

        classList() {
            return this.sb.dom.parseClassList(this.attributes.class);
        },

        id() {
            return this.attributes.id || '';
        },

        tagName() {
            return this.node.nodeName.toLowerCase();
        },

        matchingChunk() {
            const { tagName, classList, attributes } = this;
            const chunk = this.sb.chunks[this.offset];
            return isChunkMatches(chunk) ? chunk : null;
            function isChunkMatches(chunk) {
                if (!chunk) {
                    return false;
                }
                const tagMatch = !chunk.tagName || tagName === chunk.tagName.toLowerCase();
                const idMatch = !chunk.id || attributes.id === chunk.id;
                const classesMatch = chunk.classList.every(cl => classList.includes(cl));
                const attrsMatch = chunk.attributes.every(attr =>
                    attr.val ? attributes[attr.key] === attr.val : attr.key in attributes);
                return [
                    tagMatch,
                    idMatch,
                    classesMatch,
                    attrsMatch
                ].every(Boolean);
            }
        },

        isNodeActive() {
            return !!this.matchingChunk;
        },

        isIdActive() {
            return this.matchingChunk &&
                this.matchingChunk.id &&
                this.matchingChunk.id === this.id;
        },

        isTagActive() {
            return this.matchingChunk &&
                this.matchingChunk.tagName &&
                this.matchingChunk.tagName === this.tagName;
        },

        childOffset() {
            return this.matchingChunk ? this.offset + 1 : this.offset;
        },

        isHighlighted() {
            return this.sb.isHighlighted(this.node.nodeId);
        },

        isRelevant() {
            return this.sb.isRelevant(this.node.nodeId);
        },

        isInspected() {
            const { inspectedEl } = this.sb;
            return inspectedEl && inspectedEl.node.nodeId === this.node.nodeId;
        },

        isExpanded() {
            return this.sb.isExpanded(this.node.nodeId);
        },

        hasChildren() {
            return this.node.childNodeCount > 0;
        },

        isHidden() {
            return [
                this.sb.focusMode,
                !this.isRelevant,
                !this.isInsideHighlighted
            ].every(Boolean);
        },

        isOmitted() {
            return this.sb.focusMode &&
                ['HTML', 'BODY'].includes(this.node.nodeName);
        },

        filteredAttributes() {
            const { attributes } = this;
            const filtered = {};
            if (this.sb.filterJunk) {
                // Only copy a handful
                if (attributes.name) {
                    filtered.name = attributes.name;
                }
                if (attributes.type) {
                    filtered.type = attributes.type;
                }
            } else {
                // Copy everything except id, class and style
                Object.assign(filtered, attributes);
                delete filtered.id;
                delete filtered.class;
                delete filtered.style;
            }
            return filtered;
        }

    },

    methods: {

        async expand() {
            if (!this.isElementNode) {
                return;
            }
            this.sb.expandNode(this.node.nodeId);
            if (!this.node.children) {
                this.sb.dom.requestChildNodes(this.node.nodeId);
            }
        },

        collapse() {
            this.sb.collapseNode(this.node.nodeId);
        },

        isJunkIdentifier(ident) {
            return this.sb.filterJunk && csskit.isJunkIdentifier(ident);
        },

        isClassActive(cl) {
            return this.matchingChunk &&
                this.matchingChunk.classList.includes(cl);
        },

        isAttrActive(key, val) {
            return this.matchingChunk &&
                this.matchingChunk.attributes.some(attr => {
                    if (attr.key !== key) {
                        return false;
                    }
                    return val ? attr.op === '=' && attr.val === val : !attr.val;
                });
        },

        toggleTag(ev) {
            this.updateChunk(chunk => {
                if (ev.shiftKey) {
                    Object.assign(chunk, csskit.createEmptyChunk());
                    chunk.tagName = this.tagName;
                } else {
                    chunk.tagName = chunk.tagName ? '' : this.tagName;
                }
            });
        },

        toggleId(ev) {
            this.updateChunk(chunk => {
                if (ev.shiftKey) {
                    Object.assign(chunk, csskit.createEmptyChunk());
                    chunk.id = this.id;
                } else {
                    chunk.id = chunk.id ? '' : this.id;
                }
            });
        },

        toggleClass(ev, cl) {
            this.updateChunk(chunk => {
                if (ev.shiftKey) {
                    Object.assign(chunk, csskit.createEmptyChunk());
                    chunk.classList = [cl];
                } else if (chunk.classList.includes(cl)) {
                    chunk.classList = chunk.classList.filter(_ => _ !== cl);
                } else {
                    chunk.classList.push(cl);
                }
            });
        },

        toggleAttr(ev, key, val) {
            const attrSelector = { key, val, op: '=' };
            this.updateChunk(chunk => {
                if (ev.shiftKey) {
                    Object.assign(chunk, csskit.createEmptyChunk());
                    chunk.attr = attrSelector;
                } else {
                    const i = chunk.attributes.findIndex(_ => _.key === key);
                    if (i > -1) {
                        chunk.attributes.splice(i, 1);
                    } else {
                        chunk.attributes.push(attrSelector);
                    }
                }
            });
        },

        updateChunk(fn) {
            if (this.matchingChunk) {
                fn(this.matchingChunk);
            } else {
                const newChunk = csskit.createEmptyChunk();
                fn(newChunk);
                this.sb.chunks.splice(this.offset, 0, newChunk);
            }
            // Update the selector
            const newSelector = csskit.createSelector(this.sb.chunks);
            this.sb.setSelector(newSelector);
        },

        onEnter() {
            this.sb.dom.highlightNode(this.node);
        },

        onLeave() {
            this.sb.dom.hideHighlight();
        },

        onContextMenu(ev) {
            menu.popupMenu(this.getPopupMenu());
        },

        getPopupMenu() {
            const menuItems = [
                {
                    label: 'Show target element',
                    enabled: !!this.sb.inspectedEl,
                    click: () => {
                        this.sb.collapseAll();
                        this.sb.revealInspected();
                    }
                },
                {
                    label: 'Show selected results',
                    click: () => {
                        this.sb.collapseAll();
                        this.sb.expandHighlighted();
                        const [nodeId] = this.sb.highlightIds;
                        if (nodeId) {
                            this.sb.revealNode(nodeId);
                        }
                    }
                },
                {
                    label: 'Collapse all nodes',
                    click: () => this.sb.collapseAll()
                }
            ];
            return menuItems;
        }

    }

};
</script>

<style>
.sb-node {
    user-select: none;
    font-family: var(--font-family--mono);
    font-size: var(--font__size--mono);
    line-height: var(--font__line-height--mono);
    width: 100%;
}

.sb-node__children {
    width: 100%;
}

.sb-node__children--indented {
    margin-left: var(--dom-expand-ruler-shift);
    padding-left: calc(var(--dom-expand-toggler-size) + var(--dom-expand-icon-size));
    border-left: 1px solid transparent;
}

.sb-node__line {
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    cursor: default;
    box-shadow: 0 0 0 1px var(--dom-bg);
    margin: 1px 0 1px var(--dom-expand-toggler-size);
    white-space: nowrap;
}

.sb-node__line:hover {
    background: rgba(0,0,0,.05);
}

.sb-node__line:hover + .sb-node__children--indented {
    border-left: 1px solid var(--color-warm--300);
}

.sb-node__line--highlighted,
.sb-node__line--highlighted:hover {
    background: var(--color-blue--200);
}

.sb-node__line--inspected {
    background: var(--color-yellow--300);
}

.sb-node__expand {
    position: absolute;
    left: calc(var(--dom-expand-toggler-size) * -1);
    top: 0;
    height: 15px;
    display: inline-flex;
    align-self: stretch;
    width: var(--dom-expand-toggler-size);
    cursor: pointer;
    background: var(--dom-bg);
}

.sb-node__delim {
    color: var(--dom-delim-color);
}

.sb-node__tagname {
    color: var(--dom-tagname-color);
    text-transform: lowercase;
}

.sb-node__id {
    color: var(--dom-id-color);
}

.sb-node__class {
    color: var(--dom-class-color);
}

.sb-node__attr-key {
    color: var(--dom-attr-key-color);
    white-space: nowrap;
}

.sb-node__attr {
    display: flex;
}

.sb-node__attr-val {
    color: var(--dom-attr-val-color);
    max-width: 120px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.sb-node__text {
    color: var(--dom-text-color);
}

.sb-node__comp {
    position: relative;
    z-index: 2;
    padding: 1px 0;
    cursor: pointer;
}

.sb-node__comp--active {
    background: var(--color-blue--500);
    color: #fff;
}

.sb-node__comp--active * {
    color: #fff;
}
</style>
